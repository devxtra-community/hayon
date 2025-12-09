import { Button } from "@/components/ui/button";

export default function Home() {
  return (
   <div >

   {/* Main page */}
   <section className="py-5 min-h-screen bg-backround">

<div className="gradient min-h-screen rounded-xl relative">
  {/* gradient */}
   
   {/* Navigation BAR */}
     <nav className="flex items-between justify-between p-5 py-8">

    <div>
      {/* logo */}
    </div>

    <div className="flex gap-4">

      {/* buttons */}
      <Button variant={"outline"}>What is hayon</Button>
      <Button variant={"outline"}>Pricing</Button>
      <Button variant={"outline"}>Login</Button>

    </div>

    <div>
      {/* free trial button */}
    </div>


     </nav>





    {/* Hero */}

    <main>

      <div >

    <h1> Automate Your Social Meida with Ai</h1>
 
    <button>
      Sing up   <span>Now</span>
    </button>

      </div>

      {/* image */}
    <div className="px-8 pt-8 absolute bottom-0 w-full">
      <div className="bg-black h-[80vh] rounded-t-xl px-8 pt-8">
        <div className="bg-white h-full rounded-t-xl">

        </div>
      </div>
    </div>
    
    </main>

</div>

   </section>
   </div>
  );
}
