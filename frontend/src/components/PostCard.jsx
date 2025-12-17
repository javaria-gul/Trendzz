// src/components/PostCard.jsx
import React, { useState } from "react";

export default function PostCard({ post, onReact, onComment }) {
  const [commentText, setCommentText] = useState("");

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gray-300 rounded-full" />
        <div>
          <div className="font-semibold">{post.user?.name || "User"}</div>
          <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</div>
        </div>
      </div>

      <div className="mb-3 text-gray-800">{post.text}</div>

      <div className="flex items-center gap-3 text-sm mb-2">
        <button onClick={() => onReact(post._id, "love")} className="px-2 py-1 rounded hover:bg-gray-100">❤️ {post.reactionsCount || 0}</button>
        <button className="px-2 py-1 rounded hover:bg-gray-100">{post.commentsCount || 0} 💬</button>
      </div>

      <div className="flex gap-2">
        <input value={commentText} onChange={(e)=>setCommentText(e.target.value)} placeholder="Write a comment..." className="flex-1 p-2 rounded border" />
        <button onClick={()=>{ if(commentText.trim()) { onComment(post._id, commentText); setCommentText(""); }}} className="bg-blue-500 text-white px-3 rounded">Send</button>
      </div>
    </div>
  );
}
 