export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black">My Profile</h1>
        <p className="text-gray-700">View and manage your profile information</p>
      </div>

      <div className="rounded-lg border-2 border-gray-300 bg-white p-6 shadow-sm">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
            <p className="mt-1 text-sm text-gray-700">
              This information will be displayed on your profile.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-900">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  disabled
                  value="Ram"
                  className="block w-full rounded-md border-2 border-gray-300 bg-gray-50 px-4 py-2 text-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  disabled
                  value="ram@gmail.com"
                  className="block w-full rounded-md border-2 border-gray-300 bg-gray-50 px-4 py-2 text-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">
                Location
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  disabled
                  value="San Jose, CA"
                  className="block w-full rounded-md border-2 border-gray-300 bg-gray-50 px-4 py-2 text-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">
                Job Title
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  disabled
                  value="Software Engineer"
                  className="block w-full rounded-md border-2 border-gray-300 bg-gray-50 px-4 py-2 text-gray-700"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900">
              About
            </label>
            <div className="mt-1">
              <textarea
                disabled
                value="Software engineer with 2 years of experience in full-stack development. Passionate about building user-friendly applications and solving complex problems."
                rows={4}
                className="block w-full rounded-md border-2 border-gray-300 bg-gray-50 px-4 py-2 text-gray-700"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 