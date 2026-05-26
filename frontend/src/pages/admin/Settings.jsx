import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { updatePassword } from '../../services/api'
import toast from 'react-hot-toast'

const Settings = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })
      toast.success('Password updated successfully')
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-ink-900 mb-2">Settings</h1>
        <p className="text-ink-600">Manage your account settings</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-saffron-100 flex items-center justify-center">
            <Lock size={24} className="text-saffron-600" />
          </div>
          <div>
            <h2 className="font-ui font-semibold text-ink-900">Change Password</h2>
            <p className="text-sm text-ink-600">Update your password to keep your account secure</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-ui font-medium text-ink-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                required
                className="input pr-10"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-ui font-medium text-ink-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="input pr-10"
                placeholder="Enter new password (min 6 characters)"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-ui font-medium text-ink-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="input pr-10"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-ink-50 rounded-lg p-4">
            <p className="text-xs font-ui font-medium text-ink-700 mb-2">Password Requirements:</p>
            <ul className="text-xs text-ink-600 space-y-1">
              <li className="flex items-center gap-2">
                <span className={formData.newPassword.length >= 6 ? 'text-green-600' : 'text-ink-400'}>
                  {formData.newPassword.length >= 6 ? '✓' : '○'}
                </span>
                At least 6 characters
              </li>
              <li className="flex items-center gap-2">
                <span className={formData.newPassword === formData.confirmPassword && formData.newPassword ? 'text-green-600' : 'text-ink-400'}>
                  {formData.newPassword === formData.confirmPassword && formData.newPassword ? '✓' : '○'}
                </span>
                Passwords match
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
            <button
              type="button"
              onClick={() => setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
              className="btn-ghost"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Security Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-ui font-semibold text-blue-900 mb-2 text-sm">Security Tips</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Use a strong, unique password</li>
          <li>• Don't share your password with anyone</li>
          <li>• Change your password regularly</li>
          <li>• Use a mix of letters, numbers, and symbols</li>
        </ul>
      </div>
    </div>
  )
}

export default Settings
