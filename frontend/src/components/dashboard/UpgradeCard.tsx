'use client';

import { Button } from '@/components/ui/button';

export default function UpgradeCard() {
    return (
        <div className="bg-[#318D62] rounded-2xl p-8 flex flex-col justify-between h-full min-h-[200px] text-white">
            <div>
                <h3 className="text-xl font-medium leading-snug mb-2">
                    Enjoy more access <br /> than limited and best <br /> experience
                </h3>
            </div>

            <Button
                variant="outline"
                className="w-full bg-transparent border-white text-white hover:bg-white hover:text-[#318D62] transition-colors rounded-xl h-12 text-base font-medium mt-auto"
            >
                Upgrade Plan
            </Button>
        </div>
    );
}
