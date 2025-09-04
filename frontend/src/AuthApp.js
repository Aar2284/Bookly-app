import React, { useState } from 'react';
import './App.css';

const AuthApp = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4 animate-bounce">
              {isLogin ? '📖' : '✨'}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back!' : 'Join Bookly!'}
            </h2>
            <p className="text-slate-400">
              {isLogin ? 'Sign in to discover your next great read' : 'Create your account to get started'}
            </p>
          </div>

          <form className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700">
            <button className="w-full text-slate-400 hover:text-white py-2 transition-colors">
              🔐 Admin Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthApp;