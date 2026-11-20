import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  Network,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { Switch } from "../../../../../components/ui/switch";
import { Textarea } from "../../../../../components/ui/textarea";
import type { HRSettingsData } from "../../types/hrSettingsTypes";

interface AttendanceGeofencePanelProps {
  settings: HRSettingsData;
  setSettings: React.Dispatch<React.SetStateAction<HRSettingsData>>;
  gettingLocation: boolean;
  testingLocation: boolean;
  locationTestResult: {
    distance: number;
    isWithinRange: boolean;
  } | null;
  onGetCurrentLocation: () => void;
  onTestCurrentLocation: () => void;
  onOpenInGoogleMaps: () => void;
}

export const AttendanceGeofencePanel: React.FC<
  AttendanceGeofencePanelProps
> = ({
  settings,
  setSettings,
  gettingLocation,
  testingLocation,
  locationTestResult,
  onGetCurrentLocation,
  onTestCurrentLocation,
  onOpenInGoogleMaps,
}) => {
  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          إعدادات تتبع الموقع (Geofencing)
        </CardTitle>
        <CardDescription>
          تقييد الحضور والانصراف بنطاق جغرافي محدد حول مقر الشركة لضمان تواجد
          الموظفين
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border border-primary dark:border-primary rounded-xl bg-primary/50 dark:bg-primary/20">
          <div>
            <Label className="text-blue-900 dark:text-primary font-bold">
              تفعيل البصمة الجغرافية
            </Label>
            <p className="text-sm text-primary dark:text-primary">
              لن يسمح للموظف بالبصمة إلا من داخل النطاق
            </p>
          </div>
          <Switch
            checked={settings.geofenceEnabled}
            onCheckedChange={(checked) =>
              setSettings((previous) => ({
                ...previous,
                geofenceEnabled: checked,
              }))
            }
          />
        </div>

        {settings.geofenceEnabled && (
          <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>خط العرض (Latitude)</Label>
                <Input
                  type="text"
                  placeholder="30.0444"
                  value={settings.officeLatitude}
                  onChange={(e) =>
                    setSettings((previous) => ({
                      ...previous,
                      officeLatitude: e.target.value,
                    }))
                  }
                  className="tabular-nums font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>خط الطول (Longitude)</Label>
                <Input
                  type="text"
                  placeholder="31.2357"
                  value={settings.officeLongitude}
                  onChange={(e) =>
                    setSettings((previous) => ({
                      ...previous,
                      officeLongitude: e.target.value,
                    }))
                  }
                  className="tabular-nums font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>نطاق البصمة المسموح</Label>
                <span className="text-sm font-bold text-primary dark:text-primary tabular-nums font-mono">
                  {settings.geofenceRadius} متر
                </span>
              </div>
              <Input
                type="number"
                min={50}
                max={5000}
                step={50}
                value={settings.geofenceRadius}
                onChange={(e) =>
                  setSettings((previous) => ({
                    ...previous,
                    geofenceRadius: parseInt(e.target.value) || 200,
                  }))
                }
                className="tabular-nums font-mono"
              />
              <p className="text-xs text-muted-foreground">
                يفضل ألا يقل عن 100 متر لتجنب أخطاء الـ GPS الضعيف
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t mt-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onGetCurrentLocation}
                disabled={gettingLocation}
                className="flex items-center gap-2"
              >
                {gettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                تحديد موقفي الآن
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onTestCurrentLocation}
                disabled={
                  testingLocation ||
                  !settings.officeLatitude ||
                  !settings.officeLongitude
                }
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                اختبار الدقة والموقع
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onOpenInGoogleMaps}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                المعاينة على الخريطة
              </Button>
            </div>

            {locationTestResult && (
              <div
                className={`p-4 rounded-xl border-2 ${
                  locationTestResult.isWithinRange
                    ? "bg-green-50 dark:bg-success/20 border-success dark:border-success"
                    : "bg-red-50 dark:bg-destructive/20 border-destructive dark:border-destructive"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      locationTestResult.isWithinRange
                        ? "bg-green-100 dark:bg-success"
                        : "bg-red-100 dark:bg-destructive"
                    }`}
                  >
                    {locationTestResult.isWithinRange ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold">
                      الحالة:{" "}
                      {locationTestResult.isWithinRange
                        ? "داخل النطاق"
                        : "خارج النطاق"}
                    </p>
                    <p className="text-sm opacity-80 tabular-nums font-mono">
                      المسافة: {locationTestResult.distance} متر من المركز
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    {/* بطاقة التحقق عبر شبكة الفرع */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          التحقق عبر شبكة الفرع
        </CardTitle>
        <CardDescription>
          السماح بالبصمة تلقائياً للأجهزة المتصلة بشبكة الفرع المعتمدة عبر عنوان IP أو نطاق الشبكة دون التقيد بـ GPS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border border-primary dark:border-primary rounded-xl bg-primary/50 dark:bg-primary/20">
          <div>
            <Label className="text-indigo-900 dark:text-primary font-bold">
              تفعيل التحقق عبر شبكة الفرع
            </Label>
            <p className="text-sm text-primary dark:text-primary">
              السماح بالبصمة عند تطابق عنوان IP للجهاز مع عناوين شبكة الفرع المعتمدة
            </p>
          </div>
          <Switch
            checked={Boolean(settings.branchNetworkEnabled)}
            onCheckedChange={(checked) =>
              setSettings((previous) => ({
                ...previous,
                branchNetworkEnabled: checked,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>تسمية شبكة الفرع (اختياري)</Label>
          <Input
            type="text"
            placeholder="مثال: شبكة المقر الرئيسي - واي فاي الإدارة"
            value={settings.branchNetworkLabel || ""}
            onChange={(e) =>
              setSettings((previous) => ({
                ...previous,
                branchNetworkLabel: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>قائمة عناوين IP المعتمدة (IPv4 أو CIDR، كل عنوان في سطر)</Label>
          <Textarea
            placeholder={"192.168.1.1\n10.0.0.0/24\n197.35.0.0/16"}
            value={settings.branchIpAllowlist || ""}
            onChange={(e) =>
              setSettings((previous) => ({
                ...previous,
                branchIpAllowlist: e.target.value,
              }))
            }
            rows={4}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            يدعم عناوين IPv4 المحددة ونطاقات CIDR (مثل 192.168.1.0/24). افصل بين العناوين بسطر جديد أو فاصلة.
          </p>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-xl bg-muted dark:bg-muted">
          <div>
            <Label className="font-bold">
              السماح بالبصمة من المنزل
            </Label>
            <p className="text-sm text-muted-foreground">
              عند التفعيل يُسمح للبصمة من المنزل دون التحقق من النطاق الجغرافي
            </p>
          </div>
          <Switch
            checked={Boolean(settings.allowRemoteCheckIn)}
            onCheckedChange={(checked) =>
              setSettings((previous) => ({
                ...previous,
                allowRemoteCheckIn: checked,
              }))
            }
          />
        </div>
      </CardContent>
    </Card>
  </div>
  );
};
