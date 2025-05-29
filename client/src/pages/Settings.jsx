import React, { useState } from 'react';
import { useDeleteAccountMutation, useUpdatePasswordMutation } from '../services/authApi';
import { toast } from 'react-toastify';
import { Loader } from 'lucide-react';

const Settings = () => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [
    updatePassword,
    {
      isLoading: isUpdatingPassword
    
    }
  ] = useUpdatePasswordMutation();

  const [deleteAccount, {isLoading: isDeleting}] = useDeleteAccountMutation()
  const handleDeleteAccount = async()=>{
    try {
      await deleteAccount().unwrap();
      toast.success("Account deleted successfully!");
      // Optionally redirect to home or login page
    } catch (err) {
      console.error("Failed to delete account:", err);
      toast.error(err.data?.message || "Failed to delete account. Please try again.");
    }
  }
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault(); 

    const { oldPassword, newPassword, confirmPassword } = formData;

   
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    try {
      
      await updatePassword({ oldPassword, newPassword, confirmPassword }).unwrap();
      toast.success("Password updated successfully!");
     
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error("Failed to update password:", err);
      toast.error(err.data?.message || "Failed to update password. Please try again.");
    }
  };
  if (isUpdatingPassword) {
    return (
      <div className="text-center py-10">
        <Loader className="animate-spin h-6 w-6 mx-auto text-blue-600" />
        <p className="mt-2 text-gray-700">Updating password...</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Change Password</h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4"> 
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  name='oldPassword'
                  value={formData.oldPassword}
                  onChange={handleChange}
                  type="password"
                  required 
                  className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  name='newPassword'
                  value={formData.newPassword}
                  onChange={handleChange}
                  type="password"
                  required
                  className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  type="password"
                  required
                  className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  disabled={isUpdatingPassword} 
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
          <hr />

        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-red-600 mb-3">
          Danger Zone
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Once you delete your account, there is no going back. Please
          be certain.
        </p>
        <button onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default Settings;