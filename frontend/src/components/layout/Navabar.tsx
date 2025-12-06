import { Bell } from "lucide-react";
import Link from "next/link";


const navItems = [
  { name: "Dashboard", path: "/" },
  { name: "Calendar", path: "/calendar" },
  { name: "History", path: "/history" },
  { name: "Analytics", path: "/analytics" },
  { name: "Settings", path: "/settings" },
];

export const Navabar = () => {
    const pathname = "/history"; // Replace with actual pathname logic
  return (
    <nav className="w-full h-20 rouded-4xl bg-white rounded-3xl flex justify-between items-center px-12  shadow-md">
      <div className="px-6 py-4 rounded-3xl">
        <div className="flex items-center justify-between ">
          <div className="flex items-center gap-12">
            <Link href="/" >
             <img src="/images/logo.png" alt="logo" className="w-17" />
            </Link>
            
          </div>

            </div>

           </div>
            <div className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-full">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                console.log("isActive", isActive);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={
                        `px-5 py-2 rounded-full text-sm font-medium  transition-colors ${isActive ? "bg-primary text-primary-foreground bg-black text-white" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`
                    }
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>


            <div className="flex gap-5">

          <button className="relative p-2 rounded-full hover:bg-secondary transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {/* <Badge className="absolute -top-1 -right-1 bg-accent text-accent-foreground w-5 h-5 flex items-center justify-center p-0 text-xs">
              2
            </Badge> */}
          </button>

         <div className="w-10 h-10 rounded-full bg-black">

         </div>

            </div>



    </nav>
  );
};
