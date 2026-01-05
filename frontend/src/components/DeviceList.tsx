import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/context/ToastContext";
import { Loader2, Monitor, Smartphone, Trash2, Laptop, Tablet } from "lucide-react";
import { UAParser } from "ua-parser-js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
      console.log("Fetched devices:", data.data);

      // Deduplicate by tokenId to ensure no visual duplicates
      const uniqueDevices = data.data.filter(
        (device, index, self) => index === self.findIndex((d) => d.tokenId === device.tokenId),
      );

      setDevices(uniqueDevices);
    } catch (error) {
      console.error("Error loading devices:", error);
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

  const getDeviceName = (ua: string = ""): string => {
    const parser = new UAParser(ua);
    const device = parser.getDevice();
    const os = parser.getOS();
    const browser = parser.getBrowser();

    // 1. Try Vendor + Model (e.g. "Apple iPhone", "Samsung SM-G960F")
    if (device.vendor && device.model) {
      return `${device.vendor} ${device.model}`;
    }

    // 2. Try OS Name (e.g. "Windows", "macOS", "Android")
    if (os.name) {
      // Append browser name for desktop context usually helpful (e.g. "Windows - Chrome")
      const browserName = browser.name ? ` - ${browser.name}` : "";
      return `${os.name} ${os.version || ""}${browserName}`;
    }

    // 3. Fallback to Browser or "Unknown Device"
    return browser.name || "Unknown Device";
  };

  const getDeviceIcon = (ua: string = "") => {
    const parser = new UAParser(ua);
    const deviceType = parser.getDevice().type;

    if (deviceType === "mobile") return <Smartphone className="w-5 h-5 text-gray-600" />;
    if (deviceType === "tablet") return <Tablet className="w-5 h-5 text-gray-600" />;

    // Check OS for laptop/desktop differentiation (heuristic)
    const osName = parser.getOS().name?.toLowerCase();
    if (osName?.includes("mac") || osName?.includes("windows") || osName?.includes("linux")) {
      return <Laptop className="w-5 h-5 text-gray-600" />;
    }

    return <Monitor className="w-5 h-5 text-gray-600" />;
  };

  if (isLoading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin w-8 h-8 text-[#318D62]" />
      </div>
    );

  return (
    <Card className="w-full border-none shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-white px-6 py-4 border-b border-gray-100">
        <div>
          <CardTitle className="text-lg font-bold text-gray-900">Active Sessions</CardTitle>
          <CardDescription className="text-gray-500">
            View and manage devices where you're currently logged in.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDevices}
          disabled={isLoading}
          className="rounded-full text-xs h-8"
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0 bg-white">
        <div className="divide-y divide-gray-100">
          {devices.map((device) => (
            <div
              key={device.tokenId}
              className="flex items-center justify-between p-4 sm:p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-100 rounded-full flex-shrink-0">
                  {getDeviceIcon(device.userAgent)}
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <p title={getDeviceName(device.userAgent)}>{getDeviceName(device.userAgent)}</p>
                    {device.isCurrent && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-2 py-0.5 rounded-full border-none font-medium"
                      >
                        Current Device
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500 gap-1 sm:gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                      {/* Simple IP masking or just showing relevant part if needed, but for now full IP */}
                      {device.ipAddress || "Unknown IP"}
                    </span>
                    <span className="hidden sm:inline text-gray-300">•</span>
                    <span>
                      Active: {new Date(device.lastActive).toLocaleDateString()}{" "}
                      {new Date(device.lastActive).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              {device.isCurrent ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Revoke Device"
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8 sm:h-10 sm:w-10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will log you out of your current session. You will need to log in again
                        to access your account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleLogout(device.tokenId, device.isCurrent)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Logout
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleLogout(device.tokenId, device.isCurrent)}
                  title="Revoke Device"
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8 sm:h-10 sm:w-10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {devices.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Monitor className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm">No active sessions found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
