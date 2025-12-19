import React from 'react'
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Eye, EyeOff, Bookmark } from "lucide-react";
import heroIllustration from "../assets/hero-illustration.png";
import "../index.css";

import {signInWithGoogle, signUp} from "../config/Auth"

function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
  
    const handleSignUp= async () => {
  
      try{
  
        await signUp(email, password);
        alert("sign in successful")
  
      } catch(error){
        alert(error.message);
      }
  
    };

    const handleSignInWithGoogle = async () => {

        try{

            await signInWithGoogle();

        }
        catch(error){
            alert(error.message)
        }

    };
  
    return (
      <div className="min-h-screen bg-background flex">
        {/* Left side - Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12">
          <div className="max-w-md w-full mx-auto">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-12">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-serif text-xl font-semibold text-foreground">AIMarks</span>
            </div>
  
            {/* Login Header */}
            <h1 className="font-serif text-4xl font-semibold text-foreground mb-2">Sign in</h1>
            <p className="text-muted-foreground mb-8">
              Welcome back! Keep your AI insights at your fingertips.
            </p>
  
            {/* Login Form */}
            <form
                    className="space-y-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSignUp();
                    }}
            >
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
  
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
  
              <div className="flex justify-end">
                <a href="#" className="text-sm text-primary hover:text-forest-light transition-colors">
                  Forgot your password?
                </a>
              </div>
  
              <Button type="submit" className="w-full" size="lg">
                Sign in
              </Button>
            </form>
  
            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background text-muted-foreground">or</span>
              </div>
            </div>
  
            {/* Social Login */}
            <div className="grid grid-cols-2 gap-4">
              <Button variant="social" size="lg" className="gap-3" onClick={handleSignInWithGoogle}>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button variant="social" size="lg" className="gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                </svg>
                Apple
              </Button>
            </div>
  
          </div>
        </div>
  
        {/* Right side - Decorative */}
        <div className="hidden lg:flex w-1/2 bg-cream-dark relative overflow-hidden items-center justify-center">
          {/* Decorative background shapes */}
          <div className="absolute inset-0">
            {/* Top wave */}
            <svg className="absolute top-0 right-0 w-full h-48 text-forest opacity-10" viewBox="0 0 400 100" preserveAspectRatio="none">
              <path d="M0,50 Q100,0 200,50 T400,50 L400,0 L0,0 Z" fill="currentColor"/>
            </svg>
            
            {/* Bottom wave */}
            <svg className="absolute bottom-0 left-0 w-full h-64 text-coral opacity-15" viewBox="0 0 400 100" preserveAspectRatio="none">
              <path d="M0,30 Q100,80 200,30 T400,30 L400,100 L0,100 Z" fill="currentColor"/>
            </svg>
  
            {/* Floating circles */}
            <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-forest opacity-5 animate-pulse-soft"></div>
            <div className="absolute bottom-40 left-16 w-24 h-24 rounded-full bg-coral opacity-10 animate-pulse-soft" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/3 left-1/4 w-16 h-16 rounded-full bg-sage opacity-20 animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
          </div>
  
          {/* Illustration */}
          <div className="relative z-10 animate-float">
            <img 
              src={heroIllustration} 
              alt="Person organizing AI bookmarks at a desk" 
              className="w-112.5 h-auto drop-shadow-2xl"
            />
          </div>
  
          {/* Floating bookmark icons */}
          <div className="absolute top-1/4 right-16 bg-card p-3 rounded-xl shadow-lg animate-float" style={{ animationDelay: '1s' }}>
            <Bookmark className="w-6 h-6 text-coral" />
          </div>
          <div className="absolute bottom-1/3 left-20 bg-card p-3 rounded-xl shadow-lg animate-float" style={{ animationDelay: '2s' }}>
            <Bookmark className="w-6 h-6 text-forest" />
          </div>
        </div>
      </div>
    );
};

export default SignUp