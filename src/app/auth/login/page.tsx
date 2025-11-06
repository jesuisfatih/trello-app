export default function AuthLoginPage() {
  return (
    <div className="max-w-lg mx-auto py-20 px-6 text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Open from Shopify Admin</h1>
        <p className="text-gray-600">
          We couldn&apos;t identify your Shopify session. Please open the SEO DROME TEAM app from
          your Shopify admin dashboard so we can complete authentication securely.
        </p>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left space-y-3">
        <p className="text-sm text-gray-700">
          <strong>Tip:</strong> Navigate to <em>Apps &gt; SEO DROME TEAM</em> inside your Shopify admin.
          Shopify will automatically include the required session information when the app loads.
        </p>
        <p className="text-sm text-gray-500">
          If you believe this is an error, ensure the browser isn&apos;t blocking third-party cookies or try
          reloading the app directly from Shopify Admin.
        </p>
      </div>
    </div>
  )
}

