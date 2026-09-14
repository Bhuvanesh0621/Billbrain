import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="py-6 px-8 max-w-7xl mx-auto w-full flex justify-between items-center border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xl">
            B
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">BillBrain</span>
        </div>
        <div className="space-x-4">
          <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Log in
          </Link>
          <Link href="/auth/register">
            <Button className="bg-indigo-600 hover:bg-indigo-700">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="py-24 px-8 max-w-5xl mx-auto text-center flex-1 flex flex-col justify-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8">
            Understand your bills. <br/>
            <span className="text-indigo-600">Control your spending.</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12">
            Upload your bills and let AI organize, analyze, compare, and explain your expenses. 
            Turn every bill into intelligent financial insight.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/auth/register">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto h-14 px-8 text-lg">
                Start understanding your bills today
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg">
                See How It Works
              </Button>
            </Link>
          </div>
        </section>

        <section id="how-it-works" className="bg-slate-50 py-24 px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">How BillBrain Works</h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl mb-6">1</div>
                <h3 className="text-xl font-bold mb-3">Upload</h3>
                <p className="text-slate-600">Upload a PDF, image, or bill document directly to your secure vault.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl mb-6">2</div>
                <h3 className="text-xl font-bold mb-3">Understand</h3>
                <p className="text-slate-600">AI automatically extracts and structures all the important information.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl mb-6">3</div>
                <h3 className="text-xl font-bold mb-3">Analyze</h3>
                <p className="text-slate-600">BillBrain compares it with previous bills and detects unusual charges.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl mb-6">4</div>
                <h3 className="text-xl font-bold mb-3">Improve</h3>
                <p className="text-slate-600">Get personalized recommendations and automated savings insights.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
