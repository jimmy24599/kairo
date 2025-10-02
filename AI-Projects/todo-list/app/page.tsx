export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to todo-list
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Let's create a todo list app.
        </p>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <p className="text-gray-700">
            Your project has been created successfully! Start building your application.
          </p>
        </div>
      </div>
    </main>
  )
}