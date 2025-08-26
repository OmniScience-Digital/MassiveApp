"use client";

export default function Footer() {
    const currentYear = new Date().getFullYear(); // Get the current year
  
    return (
  <footer className="bg-gray-700 mt-auto">
  <div className="max-w-screen-xl px-2 pb-4 mx-auto sm:px-6 lg:px-8 lg:pt-10">

    <div className="pt-2 border-t border-gray-800">
      <div className="text-center sm:flex sm:justify-between sm:text-left">
        <p className="text-sm text-gray-400">
          <span className="block sm:inline">All rights reserved.</span>

          <a
            className="inline-block text-teal-500 underline transition hover:text-teal-500/75"
            href="/"
          >
            Terms & Conditions
          </a>

          <span>&middot;</span>

          <a
            className="inline-block text-teal-500 underline transition hover:text-teal-500/75"
            href="/"
          >
            Privacy Policy
          </a>
        </p>

        <p className="mt-4 text-sm text-gray-500 sm:order-first sm:mt-0">
          &copy; {currentYear} Massive Group
        </p>
      </div>
    </div>
  </div>
</footer>
    );
  };