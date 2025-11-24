import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Settings as SettingsIcon,
  Globe,
  Palette,
  Bell,
  Shield
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Badge } from "@/components/ui/badge";

function SettingsContent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your preferences and application settings
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of your dashboard</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Theme</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose between light and dark mode
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={toggleTheme}
                className="min-w-[100px]"
              >
                {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle>Currency & Region</CardTitle>
                <CardDescription>Set your base currency and regional preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Base Currency</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Default currency for reports and summaries
                </p>
              </div>
              <Badge variant="outline" className="text-base px-4 py-2">
                AUD $
              </Badge>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <Label className="text-base">Date Format</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  How dates are displayed throughout the app
                </p>
              </div>
              <Badge variant="outline" className="text-base px-4 py-2">
                DD/MM/YYYY
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Bell className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage how you receive updates and alerts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Transaction Alerts</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Get notified when new transactions are added
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <Label className="text-base">Budget Warnings</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Alert when approaching spending limits
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Shield className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle>Security & Privacy</CardTitle>
                <CardDescription>Manage your account security settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="outline" size="sm">
                Setup
              </Button>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <Label className="text-base">Export Data</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Download all your financial data
                </p>
              </div>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <DashboardLayout>
      <SettingsContent />
    </DashboardLayout>
  );
}
