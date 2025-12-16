import { Button } from "@/components/ui/button";
import Image from "next/image";
import dashboard_IMG from "@/assets/Dashboard.png"
import logo_IMG from "@/assets/logo.png"
import { BookOpen } from "lucide-react";
import { Book } from "lucide-react";
import Link from "next/link";
import { CardImage } from "@/components/ui/card";


export default function Home() {
  return (
   <div >

   {/* Main page */}
   <section className="p-8 min-h-screen bg-backround">

<div className="gradient min-h-screen rounded-xl relative">
  {/* gradient */}
   
   {/* Navigation BAR */}
     <nav className="flex items-between justify-between px-8 py-8">

    <div>
      {/* logo */}
      <Image src={logo_IMG} alt="logo"></Image>
    </div>

    <div className="flex gap-4">

      {/* buttons */}
      <Button variant={"outline"}>What is hayon</Button>

      <Link href="/pricing">
      <Button variant={"outline"}>Pricing</Button>
      </Link>

      <Link href="/login">
      <Button variant={"outline"}>Login</Button>
      </Link>

    </div>

    <div>
      {/* free trial button */}
      <Button variant={"black"}>Start Free Trial</Button>
    </div>


     </nav>





    {/* Hero */}

    <main>

      <div  className=" flex justify-center items-center gap-18 flex-col mt-25">

    <h1 className="text-6xl w-1/2 text-center font-semi-bold"> Automate Your Social Meida with Ai</h1>
 
    <button className="px-8 py-5 bg-background rounded-full text-xl">
     Sing Up  <span className="ml-15 bg-foreground px-5 py-2 rounded-full text-lg text-background">Now</span>
    </button>

      </div>

      {/* image */}
    <div className="px-8 pt-8  w-full mt-20">
      <div className="bg-black h-[90vh] rounded-t-xl px-8 pt-8">
      <div className="h-full rounded-t-x bg-cover bg-center "></div>
      </div>
    </div>
    
    </main>

</div>

   </section>


<section className="min-h-screen">

<div className="flex items-center flex-col gap-3 justify-center mt-7">

 <h1>
  <Button variant={"icon_outline"} > <BookOpen size={18}/> How it works</Button>
 </h1>

 <h1 className="text-4xl">
    How hayon works
 </h1>

 <p>
hayon help people to reduce time your social account managing
 </p>

</div>


<div className="parent mt-5 h-[70vh] w-full px-18">

  <CardImage className="div1 "/>
  <CardImage className="div2 "/>
  <CardImage className="div3 "/>
  <CardImage className="div4 "/>
  <CardImage className="div5 "/>

</div>
  

</section>




<section className="min-h-screen">
<div className="flex items-center flex-col gap-3 justify-center mt-7">

 <h1>
  <Button variant={"icon_outline"} > <Book size={18}></Book> How it works</Button>
 </h1>

 <h1 className="text-4xl w-1/3 text-center">
   Powerful Features 
   To Grow Your Audience
 </h1>



</div>

</section>


  


   </div>
  );
}
