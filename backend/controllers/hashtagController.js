// backend/controllers/hashtagController.js
import Post from "../models/Post.js";

// Get posts by hashtag
export const getPostsByHashtag = async (req, res) => {
  try {
    const { hashtag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Clean hashtag (remove # if present, make lowercase)
    const cleanHashtag = hashtag.replace('#', '').toLowerCase();

    console.log(`🔍 Searching posts with hashtag: #${cleanHashtag}`);

    // Find posts containing this hashtag (case-insensitive)
    const posts = await Post.find({
      hashtags: { $regex: new RegExp(`^${cleanHashtag}$`, 'i') }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name username avatar profilePicture role')
      .populate('likes.user', 'name username avatar profilePicture role')
      .populate('comments.user', 'name username avatar profilePicture role')
      .populate('comments.replies.user', 'name username avatar profilePicture role')
      .lean();

    // Add counts
    const postsWithCounts = posts.map(post => ({
      ...post,
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0
    }));

    const totalPosts = await Post.countDocuments({
      hashtags: { $regex: new RegExp(`^${cleanHashtag}$`, 'i') }
    });

    console.log(`✅ Found ${posts.length} posts with #${cleanHashtag}`);

    res.json({
      success: true,
      hashtag: cleanHashtag,
      posts: postsWithCounts,
      pagination: {
        page,
        limit,
        total: totalPosts,
        pages: Math.ceil(totalPosts / limit)
      }
    });
  } catch (error) {
    console.error('Get posts by hashtag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts by hashtag'
    });
  }
};

// Get trending hashtags
export const getTrendingHashtags = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 7; // Default last 7 days

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    console.log(`📊 Getting trending hashtags from last ${days} days`);

    // Aggregate hashtags from recent posts
    const trendingHashtags = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFrom },
          hashtags: { $exists: true, $ne: [] }
        }
      },
      { $unwind: '$hashtags' },
      {
        $group: {
          _id: { $toLower: '$hashtags' }, // Case-insensitive grouping
          count: { $sum: 1 },
          latestPost: { $max: '$createdAt' }
        }
      },
      { $sort: { count: -1, latestPost: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          hashtag: '$_id',
          count: 1,
          latestPost: 1
        }
      }
    ]);

    console.log(`✅ Found ${trendingHashtags.length} trending hashtags`);

    res.json({
      success: true,
      trending: trendingHashtags
    });
  } catch (error) {
    console.error('Get trending hashtags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending hashtags'
    });
  }
};

// Search hashtags (for autocomplete)
export const searchHashtags = async (req, res) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit) || 10;

    if (!q || q.length < 1) {
      return res.json({
        success: true,
        hashtags: []
      });
    }

    // Clean search query
    const searchQuery = q.replace('#', '').toLowerCase();

    console.log(`🔍 Searching hashtags matching: ${searchQuery}`);

    // Find hashtags that match the search query
    const hashtags = await Post.aggregate([
      {
        $match: {
          hashtags: { $exists: true, $ne: [] }
        }
      },
      { $unwind: '$hashtags' },
      {
        $match: {
          hashtags: { $regex: new RegExp(`^${searchQuery}`, 'i') }
        }
      },
      {
        $group: {
          _id: { $toLower: '$hashtags' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          hashtag: '$_id',
          count: 1
        }
      }
    ]);

    console.log(`✅ Found ${hashtags.length} matching hashtags`);

    res.json({
      success: true,
      hashtags
    });
  } catch (error) {
    console.error('Search hashtags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search hashtags'
    });
  }
};

// Get hashtag stats
export const getHashtagStats = async (req, res) => {
  try {
    const { hashtag } = req.params;
    const cleanHashtag = hashtag.replace('#', '').toLowerCase();

    const postCount = await Post.countDocuments({
      hashtags: { $regex: new RegExp(`^${cleanHashtag}$`, 'i') }
    });

    // Get first and last post dates
    const posts = await Post.find({
      hashtags: { $regex: new RegExp(`^${cleanHashtag}$`, 'i') }
    })
      .sort({ createdAt: -1 })
      .limit(1)
      .select('createdAt')
      .lean();

    const firstPost = await Post.find({
      hashtags: { $regex: new RegExp(`^${cleanHashtag}$`, 'i') }
    })
      .sort({ createdAt: 1 })
      .limit(1)
      .select('createdAt')
      .lean();

    res.json({
      success: true,
      hashtag: cleanHashtag,
      stats: {
        postCount,
        latestPost: posts[0]?.createdAt || null,
        firstPost: firstPost[0]?.createdAt || null
      }
    });
  } catch (error) {
    console.error('Get hashtag stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hashtag stats'
    });
  }
};
