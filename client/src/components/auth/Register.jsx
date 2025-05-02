import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserIcon, MailIcon, LockIcon, PhoneIcon, MapPinIcon, LoaderCircle } from 'lucide-react';
import { useRegisterUser1Mutation, useRegisterUser2Mutation } from '../../services/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../features/auth/authSlice';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'both',
    phone: '',
    location: '',
    businessName: '',
    businessDescription: '',
    taxId: ''
  });

  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // RTK Query mutations
  const [registerUser1,{isError:register1Error , isLoading:register1Loading, data: register1Data}] = useRegisterUser1Mutation();
  const [registerUser2,{isError:register2Error , isLoading:register2Loading, data: register2Data}] = useRegisterUser2Mutation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  console.log(register1Data);

  const validateStep1 = () => {
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError(register1Error?.data?.message || 'Please fill in all required fields');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(register1Error?.data?.message || 'Passwords do not match');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
  register1Error && setError(register1Error?.data?.message);
    if (formData.email.length < 5 || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!formData.phone || !formData.location) {
      setError('Please fill in all required fields');
      return false;
    }
    if ((formData.role === 'seller' || formData.role === 'both') && 
        (!formData.businessName || !formData.businessDescription)) {
      setError('Please fill in all seller information');
      return false;
    }
    return true;
  };

  const handleNextStep = async () => {
    if (!validateStep1()) return;

    try {
      // Call first registration step API
      await registerUser1({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      }).unwrap();

      setError('');
      setStep(2);
    } catch (err) {
      setError( err?.data?.message || 'Registration failed. Please try again.');
      
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 1) {
      await handleNextStep();
      return;
    }

    if (!validateStep2()) return;

    try {
      // Call second registration step API
      const userData = await registerUser2({
        role: formData.role,
        phone: formData.phone,
        location: formData.location,
        businessName: formData.businessName,
        businessDescription: formData.businessDescription,
        taxId: formData.taxId
      }).unwrap();

      // Update Redux store with user data
      dispatch(setCredentials({ 
        user: userData.user, 
        token: userData.token 
      }));

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
          <p className="text-gray-600 mt-2">Join our auction community today</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <div className="mb-6">
                <label htmlFor="fullName" className="block mb-2 text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    id="fullName" 
                    name="fullName" 
                    type="text" 
                    value={formData.fullName} 
                    onChange={handleInputChange} 
                    className="pl-10 w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="John Doe" 
                    required 
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MailIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    className="pl-10 w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="you@example.com" 
                    required 
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    id="password" 
                    name="password" 
                    type="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    className="pl-10 w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="••••••••" 
                    required 
                    minLength={8} 
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Must be at least 8 characters long
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type="password" 
                    value={formData.confirmPassword} 
                    onChange={handleInputChange} 
                    className="pl-10 w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <button 
                  type="submit" 
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={register1Loading}
                >


                 {
                  register1Loading ? (
                    <>
                    <div className='w-full flex justify-center items-center'>
                    
                        Register...
                    <LoaderCircle className="animate-spin h-5 w-5 " />
                    </div>
                    </>
                  ):(
                    <>
                     Continue
                    </>
                  )
                 }
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <label htmlFor="role" className="block mb-2 text-sm font-medium text-gray-700">
                  I want to <span className="text-red-500">*</span>
                </label>
                <select 
                  id="role" 
                  name="role" 
                  value={formData.role} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" 
                  required
                >
                  <option value="both">Buy and Sell Items</option>
                  <option value="buyer">Only Buy Items</option>
                  <option value="seller">Only Sell Items</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    className="pl-10 w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="(123) 456-7890" 
                    required 
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="location" className="block mb-2 text-sm font-medium text-gray-700">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    id="location" 
                    name="location" 
                    type="text" 
                    value={formData.location} 
                    onChange={handleInputChange} 
                    className="pl-10 w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="City, State" 
                    required 
                  />
                </div>
              </div>
              
              {(formData.role === 'seller' || formData.role === 'both') && (
                <>
                  <div className="mb-6">
                    <label htmlFor="businessName" className="block mb-2 text-sm font-medium text-gray-700">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <div className="h-5 w-5 text-gray-400" />
                      </div>
                      <input 
                        id="businessName" 
                        name="businessName" 
                        type="text" 
                        value={formData.businessName} 
                        onChange={handleInputChange} 
                        className="pl-10 w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="Your Business Name" 
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="businessDescription" className="block mb-2 text-sm font-medium text-gray-700">
                      Business Description <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      id="businessDescription" 
                      name="businessDescription" 
                      value={formData.businessDescription} 
                      onChange={handleInputChange} 
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" 
                      rows={3} 
                      placeholder="Tell us about your business..." 
                      required 
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="taxId" className="block mb-2 text-sm font-medium text-gray-700">
                      Tax ID/Business Registration Number
                    </label>
                    <input 
                      id="taxId" 
                      name="taxId" 
                      type="text" 
                      value={formData.taxId} 
                      onChange={handleInputChange} 
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Optional" 
                    />
                  </div>
                </>
              )}
              
              <div className="flex gap-4 mb-6">
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  disabled={register2Loading}
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
           {
            register2Loading ? (
              <>
              <div className='w-full flex justify-center items-center'>

              <LoaderCircle className="animate-spin h-5 w-5 " />
              </div>
              </>
            ): (
              <>
              Create Account
              </>
            )
           } 
                </button>
              </div>
            </>
          )}
          
          <div className="text-center text-sm">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;