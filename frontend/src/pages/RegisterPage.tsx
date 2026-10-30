import { motion } from "framer-motion";
import {
  CarFront,
  ShieldCheck,
  MapPin,
  Clock3,
} from "lucide-react";

import RegisterForm from "../features/auth/components/RegisterForm";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Easy account management",
    description: "Keep your rental information organized.",
  },
  {
    icon: MapPin,
    title: "Find your next ride",
    description: "Explore vehicles for your next destination.",
  },
  {
    icon: Clock3,
    title: "A smoother experience",
    description: "Make your vehicle rental journey more convenient.",
  },
];

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white -mt-5">
      <main className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-12 sm:px-8 lg:min-h-[75vh] lg:grid-cols-2 lg:gap-16 lg:py-16">
        <section className="flex justify-center lg:justify-start">
          <RegisterForm />
        </section>

        <motion.section
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative hidden min-h-[580px] flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-800 via-blue-600 to-sky-500 p-10 text-white lg:flex xl:p-12"
        >
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-sky-300/20" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <CarFront size={28} />
              </div>

              <span className="text-xl font-bold tracking-tight">
                DriveEase
              </span>
            </div>

            <h2 className="mt-16 max-w-lg text-4xl font-bold leading-tight xl:text-5xl">
              Your next adventure starts with the right ride.
            </h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-blue-100 xl:text-base">
              Create your account and get ready to explore a more
              convenient way to find and rent your next vehicle.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <Icon size={22} />
                  </div>

                  <div>
                    <h3 className="font-semibold">{benefit.title}</h3>
                    <p className="mt-1 text-sm text-blue-100">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      </main>

    </div>
  );
}