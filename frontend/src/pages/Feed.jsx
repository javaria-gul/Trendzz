// src/pages/Feed.jsx
import React, { useEffect, useState, useContext } from "react";
import { getFeed, createPost, reactPost, commentPost } from "../services/posts";
import PostCard from "../components/PostCard";
import { AuthContext } from "../context/AuthContext";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [newText, setNewText] = useState("");
  const { userToken } = useContext(AuthContext);

  const loadFeed = async () => {
    try {
      const res = await getFeed({ page: 1, limit: 20 });
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("Load feed error", err);
    }
  };

  useEffect(()=> {
    loadFeed();
  }, []);

  const handleCreate = async () => {
    if (!newText.trim()) return;
    try {
      await createPost({ text: newText });
      setNewText("");
      await loadFeed();
    } catch (err) {
      console.error(err);
      alert("Create post failed");
    }
  };

  const handleReact = async (postId, type) => {
    try {
      await reactPost(postId, type);
      await loadFeed();
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (postId, text) => {
    try {
      await commentPost(postId, text);
      await loadFeed();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <textarea value={newText} onChange={(e)=>setNewText(e.target.value)} placeholder="What's happening?" className="w-full p-3 border rounded" />
          <div className="mt-2 text-right">
            <button onClick={handleCreate} className="bg-purple-600 text-white px-4 py-2 rounded">Post</button>
          </div>
        </div>

        {posts.length === 0 && <div className="text-center text-gray-500">No posts yet</div>}
        {posts.map(p => <PostCard key={p._id} post={p} onReact={handleReact} onComment={handleComment} />)}
      </div>
    </div>
  );
}
 