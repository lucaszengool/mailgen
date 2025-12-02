import React from 'react';
import { SignUp } from '@clerk/clerk-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400">Join MailGen and start your email marketing journey</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-gray-800 border border-gray-700 shadow-2xl',
              headerTitle: 'text-white',
              headerSubtitle: 'text-gray-400',
              socialButtonsBlockButton: 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600',
              formButtonPrimary: 'bg-green-600 hover:bg-green-700',
              footerActionLink: 'text-green-500 hover:text-green-400',
              identityPreviewText: 'text-white',
              identityPreviewEditButton: 'text-gray-400',
              formFieldLabel: 'text-gray-300',
              formFieldInput: 'bg-gray-700 border-gray-600 text-white',
              formFieldInputShowPasswordButton: 'text-gray-400',
              dividerLine: 'bg-gray-600',
              dividerText: 'text-gray-400',
              footerActionText: 'text-gray-400',
              otpCodeFieldInput: 'bg-gray-700 border-gray-600 text-white',
            }
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
