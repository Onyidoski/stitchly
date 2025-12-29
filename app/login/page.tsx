'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    // Form States
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [businessName, setBusinessName] = useState('')

    const handleAuth = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (isSignUp) {
                // SIGN UP LOGIC
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            business_name: businessName,
                        },
                    },
                })
                if (signUpError) throw signUpError
                setError('Check your email for the confirmation link!')
            } else {
                // LOGIN LOGIC
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (signInError) throw signInError
                router.push('/') // Redirect to dashboard
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full">
            {/* Left Side - Form */}
            <div className="flex w-full flex-col justify-center bg-white px-8 py-12 md:w-1/2 lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-10">
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-indigo-600">
                            {/* Logo Icon Placeholder if needed */}
                            Stitchly
                        </h1>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                            Welcome to Stitchly
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            {isSignUp ? 'Join the fashion revolution' : 'Please login to your account'}
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleAuth}>
                        {isSignUp && (
                            <>
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Full Name</label>
                                    <input
                                        type="text"
                                        required={isSignUp}
                                        className="mt-1 block w-full border-b border-gray-300 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:outline-none sm:text-sm"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Business Name</label>
                                    <input
                                        type="text"
                                        required={isSignUp}
                                        className="mt-1 block w-full border-b border-gray-300 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:outline-none sm:text-sm"
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="text-xs font-medium text-gray-500">Enter Email</label>
                            <input
                                type="email"
                                required
                                className="mt-1 block w-full border-b border-gray-300 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:outline-none sm:text-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500">Enter Password</label>
                            <div className="relative mt-1">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="block w-full border-b border-gray-300 py-2 pr-10 text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:outline-none sm:text-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-0 flex h-full items-center pr-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                                    ) : (
                                        <Eye className="h-4 w-4" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                                    Keep me signed in
                                </label>
                            </div>
                            {!isSignUp && (
                                <div className="text-sm">
                                    <a href="#" className="font-semibold text-blue-500 hover:text-blue-400">
                                        Forgot Password?
                                    </a>
                                </div>
                            )}
                        </div>


                        {error && <div className="text-sm text-red-500">{error}</div>}

                        <div className="flex items-center gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSignUp ? 'Sign Up' : 'Sign In'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                            >
                                {isSignUp ? 'Log In' : 'Sign Up'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Side - Hero Image */}
            <div className="hidden w-1/2 bg-orange-500 md:block relative">
                <Image
                    src="/login-hero4.png"
                    alt="Fashion Model"
                    fill
                    className="object-cover"
                    priority
                />
            </div>
        </div>
    )
}