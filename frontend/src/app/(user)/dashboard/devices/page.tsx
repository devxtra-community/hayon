"use client";

import DeviceList from "@/components/DeviceList";

export default function DevicesPage() {
  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Device Management</h1>
      </div>
      <DeviceList />
    </div>
  );
}
