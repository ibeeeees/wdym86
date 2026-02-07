import { Download, Apple, MonitorIcon, Smartphone, Shield, Zap, Cloud, CheckCircle2 } from 'lucide-react'

interface DownloadOption {
  platform: string
  icon: typeof Apple
  version: string
  size: string
  requirements: string
  downloadUrl: string
  available: boolean
}

const downloadOptions: DownloadOption[] = [
  {
    platform: 'macOS',
    icon: Apple,
    version: '1.0.0',
    size: '85 MB',
    requirements: 'macOS 11.0 (Big Sur) or later',
    downloadUrl: '#macos-download',
    available: true
  },
  {
    platform: 'Windows',
    icon: MonitorIcon,
    version: '1.0.0',
    size: '92 MB',
    requirements: 'Windows 10 (64-bit) or later',
    downloadUrl: '#windows-download',
    available: true
  },
  {
    platform: 'iOS',
    icon: Smartphone,
    version: '1.0.0',
    size: '45 MB',
    requirements: 'iOS 15.0 or later',
    downloadUrl: '#ios-download',
    available: false
  },
  {
    platform: 'Android',
    icon: Smartphone,
    version: '1.0.0',
    size: '38 MB',
    requirements: 'Android 10 or later',
    downloadUrl: '#android-download',
    available: false
  }
]

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Native performance with instant startup and responsive UI'
  },
  {
    icon: Cloud,
    title: 'Cloud Sync',
    description: 'Seamlessly sync your data across all devices'
  },
  {
    icon: Shield,
    title: 'Secure',
    description: 'End-to-end encryption for all your sensitive data'
  }
]

export default function Downloads() {
  const handleDownload = (option: DownloadOption) => {
    if (!option.available) {
      alert(`${option.platform} app coming soon! Join the waitlist to get notified.`)
      return
    }

    // In production, this would trigger actual download
    alert(`Starting download for ${option.platform}...\n\nVersion: ${option.version}\nSize: ${option.size}`)
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-500/30">
            <Download className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-white text-xs font-bold">M</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-black dark:text-white mb-3">
          Download Mykonos
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
          Get the full power of AI-driven inventory intelligence for your Mediterranean restaurant.
          Works offline with automatic cloud sync.
        </p>
      </div>

      {/* Download Options */}
      <div className="grid md:grid-cols-2 gap-6">
        {downloadOptions.map((option) => {
          const Icon = option.icon
          return (
            <div
              key={option.platform}
              className={`relative bg-white dark:bg-neutral-800 rounded-2xl border-2 p-6 transition-all ${
                option.available
                  ? 'border-neutral-200 dark:border-neutral-700 hover:border-red-500 dark:hover:border-red-500 hover:shadow-xl hover:shadow-red-500/10'
                  : 'border-neutral-200 dark:border-neutral-700 opacity-75'
              }`}
            >
              {!option.available && (
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 text-xs font-medium rounded-full">
                    Coming Soon
                  </span>
                </div>
              )}

              <div className="flex items-start space-x-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  option.available
                    ? 'bg-gradient-to-br from-red-500 to-red-600'
                    : 'bg-neutral-200 dark:bg-neutral-700'
                }`}>
                  <Icon className={`w-8 h-8 ${option.available ? 'text-white' : 'text-neutral-400'}`} />
                </div>

                <div className="flex-1">
                  <h2 className="text-xl font-bold text-black dark:text-white mb-1">
                    {option.platform}
                  </h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                    {option.requirements}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-neutral-500 mb-4">
                    <span>v{option.version}</span>
                    <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                    <span>{option.size}</span>
                  </div>

                  <button
                    onClick={() => handleDownload(option)}
                    disabled={!option.available}
                    className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all ${
                      option.available
                        ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    <Download className="w-5 h-5" />
                    <span>{option.available ? 'Download Now' : 'Notify Me'}</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Features */}
      <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-black dark:text-white text-center mb-8">
          Why Download the Desktop App?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="text-center">
                <div className="w-14 h-14 bg-white dark:bg-neutral-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Icon className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="font-bold text-black dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* System Requirements */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-bold text-black dark:text-white mb-4">System Requirements</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-black dark:text-white flex items-center space-x-2 mb-3">
              <Apple className="w-5 h-5" />
              <span>macOS</span>
            </h3>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              {[
                'macOS 11.0 (Big Sur) or later',
                'Apple Silicon (M1/M2/M3) or Intel Mac',
                '4GB RAM minimum (8GB recommended)',
                '200MB available storage'
              ].map(req => (
                <li key={req} className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-black dark:text-white flex items-center space-x-2 mb-3">
              <MonitorIcon className="w-5 h-5" />
              <span>Windows</span>
            </h3>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              {[
                'Windows 10 (64-bit) or later',
                'Intel Core i3 or AMD equivalent',
                '4GB RAM minimum (8GB recommended)',
                '250MB available storage'
              ].map(req => (
                <li key={req} className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Installation Guide */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-bold text-black dark:text-white mb-4">Installation Guide</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-black dark:text-white mb-3">macOS Installation</h3>
            <ol className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
              {[
                'Download the .dmg file',
                'Open the downloaded file',
                'Drag Mykonos to Applications folder',
                'Open Mykonos from Applications',
                'Sign in with your account'
              ].map((step, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <span className="w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-black dark:text-white mb-3">Windows Installation</h3>
            <ol className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
              {[
                'Download the .exe installer',
                'Run the installer as Administrator',
                'Follow the installation wizard',
                'Launch Mykonos from Start Menu',
                'Sign in with your account'
              ].map((step, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <span className="w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center py-4">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Need help? Contact us at{' '}
          <a href="mailto:support@mykonos.ai" className="text-red-500 hover:underline">
            support@mykonos.ai
          </a>
        </p>
      </div>
    </div>
  )
}
