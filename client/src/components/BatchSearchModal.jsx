import { useState } from 'react'
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
  BriefcaseIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function BatchSearchModal({ isOpen, onClose, onStartSearch }) {
  const [industry, setIndustry] = useState('')
  const [region, setRegion] = useState('')
  const [keywords, setKeywords] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!industry && !keywords) {
      toast.error('Please enter at least an industry or keywords')
      return
    }

    setIsSearching(true)

    try {
      // Pass search parameters to parent component
      await onStartSearch({
        industry: industry || keywords,
        region,
        keywords
      })

      // Close modal after starting search
      handleClose()
    } catch (error) {
      console.error('Batch search failed:', error)
      toast.error('Failed to start batch search')
      setIsSearching(false)
    }
  }

  const handleClose = () => {
    if (!isSearching) {
      setIndustry('')
      setRegion('')
      setKeywords('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Batch Prospect Search</h2>
              <p className="text-green-100 text-sm">AI-powered prospect discovery</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSearching}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Industry Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <BriefcaseIcon className="w-4 h-4 mr-2 text-green-600" />
              Industry
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Food Technology, SaaS, E-commerce"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              disabled={isSearching}
            />
            <p className="text-xs text-gray-500 mt-1">Specify the target industry for prospect search</p>
          </div>

          {/* Region Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <GlobeAltIcon className="w-4 h-4 mr-2 text-green-600" />
              Region
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g., United States, California, Global"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              disabled={isSearching}
            />
            <p className="text-xs text-gray-500 mt-1">Optional: Target geographic location</p>
          </div>

          {/* Keywords Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <MagnifyingGlassIcon className="w-4 h-4 mr-2 text-green-600" />
              Keywords
            </label>
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., CEO, founder, decision maker, manager"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
              disabled={isSearching}
            />
            <p className="text-xs text-gray-500 mt-1">Additional search terms to refine results</p>
          </div>

          {/* Info Banner */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <SparklesIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">AI-Powered Search</p>
                <p className="text-green-700">
                  Our AI will search the web to find qualified prospects matching your criteria.
                  You'll receive notifications when the search starts and completes.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSearching}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSearching || (!industry && !keywords)}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSearching ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Starting Search...</span>
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="w-5 h-5" />
                  <span>Start Batch Search</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
