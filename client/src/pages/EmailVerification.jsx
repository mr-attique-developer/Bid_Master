import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';
import { useVerifyEmailMutation, useResendVerificationEmailMutation } from '../services/authApi';
import LoadingSpinner from '../components/LoadingSpinner';

const EmailVerification = () => {
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [detailedError, setDetailedError] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [verifyEmail, { isLoading, error }] = useVerifyEmailMutation();
  const [resendVerification, { isLoading: resendLoading }] = useResendVerificationEmailMutation();
  
  // Get current auth state
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const handleVerifyEmail = async () => {
      try {
        console.log('Verifying token:', token);
        
        const result = await verifyEmail(token).unwrap();
        
        console.log('Verification successful:', result);
        
        setStatus('success');
        setMessage(result.message || 'Email verified successfully! You can now complete your registration.');
        
        // Note: Auth state is automatically updated via extraReducers in authSlice
        
        // Redirect to registration step 2 after 2 seconds
        setTimeout(() => {
          navigate('/register2');
        }, 2000);
      } catch (error) {
        console.error('Verification error:', error);
        console.log('Error details:', error);
        
        // Check if the error message indicates the email is already verified or token is invalid
        const errorMessage = error.data?.message || error.message || '';
        
        if (errorMessage.includes('already verified') || 
            errorMessage.includes('Email verification completed') ||
            errorMessage.includes('proceed to complete')) {
          // Email is already verified, treat as success
          setStatus('success');
          setMessage('Email is already verified! Redirecting to complete your registration...');
          
          // Redirect to registration step 2
          setTimeout(() => {
            navigate('/register2');
          }, 2000);
        } else if (errorMessage.includes('Invalid verification token') || 
                   errorMessage.includes('used or expired')) {
          // Token is invalid, but check if user is now authenticated (from cookie)
          setStatus('error');
          setMessage('This verification link has been used. If your email is verified, you can continue registration below.');
          setDetailedError(`Error: ${errorMessage}`);
        } else {
          setStatus('error');
          setMessage(errorMessage || 'Email verification failed.');
          setDetailedError(`Error: ${errorMessage}`);
        }
      }
    };

    if (token) {
      handleVerifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid verification link.');
    }
  }, [token, navigate, dispatch, verifyEmail]);

  // Check if user became authenticated after verification attempt
  useEffect(() => {
    if (isAuthenticated && user && user.isEmailVerified && status === 'error') {
      console.log('User is authenticated despite error, treating as success');
      setStatus('success');
      setMessage('Email verified successfully! Redirecting to complete your registration...');
      setTimeout(() => {
        navigate('/register2');
      }, 2000);
    }
  }, [isAuthenticated, user, status, navigate]);

  const handleResendEmail = async () => {
    try {
      const email = prompt('Please enter your email address:');
      if (!email) return;

      const result = await resendVerification({ email }).unwrap();
      
      setMessage('Verification email sent successfully. Please check your inbox.');
    } catch (error) {
      setMessage(error.data?.message || 'Failed to send verification email.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8">
        <div className="text-center">
          {status === 'verifying' && (
            <>
              <LoadingSpinner />
              <h2 className="text-2xl font-bold text-gray-900 mt-4">
                Verifying Email
              </h2>
              <p className="text-gray-600 mt-2">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-600 mt-4">
                Email Verified!
              </h2>
              <p className="text-gray-600 mt-2">{message}</p>
              <p className="text-sm text-gray-500 mt-4">
                Redirecting you to complete your registration...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-600 mt-4">
                Verification Link Used
              </h2>
              <p className="text-gray-600 mt-2">{message}</p>
              {detailedError && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-700 font-mono">
                    Debug Info: {detailedError}
                  </p>
                </div>
              )}
              
              {/* Show different buttons based on authentication status */}
              {isAuthenticated && user ? (
                <div className="mt-6">
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✅ You are logged in as <strong>{user.fullName}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/register2')}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200"
                  >
                    Continue Registration
                  </button>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleResendEmail}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
                  >
                    Resend Verification Email
                  </button>
                  
                  <button
                    onClick={() => navigate('/register2')}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200"
                  >
                    Continue Registration
                  </button>
                  
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition duration-200"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
