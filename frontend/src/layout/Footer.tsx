import { CarFront, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Link to="/" className="flex items-center gap-3 text-white">
            <span className="rounded-xl bg-blue-600 p-2">
              <CarFront size={23} />
            </span>
            <span className="text-xl font-black">
              Drive<span className="text-blue-400">Easy.</span>
            </span>
          </Link>

          <p className="mt-4 max-w-xs text-sm leading-7 text-slate-400">
            Find your ideal ride for everyday trips, family adventures,
            and your next road trip.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-white">Quick Links</h3>
          <div className="mt-5 flex flex-col gap-3 text-sm">
            <Link to="/" className="hover:text-blue-400">Home</Link>
            <Link to="/#vehicles" className="hover:text-blue-400">Vehicles</Link>
            <Link to="/#how-it-works" className="hover:text-blue-400">How It Works</Link>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-white">Vehicle Categories</h3>
          <div className="mt-5 flex flex-col gap-3 text-sm text-slate-400">
            <span>Economy</span>
            <span>Sedan</span>
            <span>SUV</span>
            <span>Electric</span>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-white">Contact</h3>
          <div className="mt-5 space-y-4 text-sm">
            <p className="flex items-center gap-3">
              <Mail size={17} className="text-blue-400" />
              support@example.com
            </p>
            <p className="flex items-center gap-3">
              <Phone size={17} className="text-blue-400" />
              +63 900 000 0000
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} DriveEasy. All rights reserved.
      </div>
    </footer>
  );
}