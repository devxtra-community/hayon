import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/context/ToastContext";
import { Loader2, Monitor, Smartphone, Trash2 } from "lucide-react";

interface Device {
  tokenId: string;
  ipAddress?: string;
  userAgent?: string;
  lastActive: string;
  createdAt: string;
  isCurrent?: boolean;
}

export default function DeviceList() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const fetchDevices = async () => {
    try {
      const { data } = await api.get<{ data: Device[] }>("/auth/devices");
      setDevices(data.data);
    } catch (error) {
      console.error(error);
      showToast("error", "Error", "Failed to load devices");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleLogout = async (tokenId: string, isCurrent: boolean = false) => {
    try {
      await api.delete(`/auth/devices/${tokenId}`);
      if (isCurrent) {
        window.location.reload();
        return;
      }
      setDevices(devices.filter((d) => d.tokenId !== tokenId));
      showToast("success", "Success", "Device logged out");
    } catch {
      showToast("error", "Error", "Failed to logout device");
    }
  };

  const getDeviceIcon = (ua: string = "") => {
    if (/mobile/i.test(ua)) return <Smartphone className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  if (isLoading)
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Logged-in Devices</CardTitle>
          <CardDescription>Manage your active sessions</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDevices} disabled={isLoading}>
          Refresh List
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {devices.map((device) => (
          <div
            key={device.tokenId}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gray-100 rounded-full">{getDeviceIcon(device.userAgent)}</div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-2">
                  <p
                    className="font-medium truncate max-w-[200px] sm:max-w-md"
                    title={device.userAgent}
                  >
                    {device.userAgent || "Unknown Device"}
                  </p>
                  {device.isCurrent && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      This Device
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {device.ipAddress} • {new Date(device.lastActive).toLocaleDateString()}{" "}
                  {new Date(device.lastActive).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleLogout(device.tokenId, device.isCurrent)}
              title="Revoke Device"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        ))}
        {devices.length === 0 && (
          <p className="text-center text-gray-500">No other devices found</p>
        )}
      </CardContent>
    </Card>
  );
}
