import React from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import {
  DateFormatType,
  DATE_FORMAT_LABELS,
  formatTimeWithZone,
} from "../../../utils/dateFormat";

interface CompanyTimezoneSectionProps {
  timezone?: string;
  handleTimezoneChange: (timezone: string) => void;
  currentTime: Date;
  dateFormat: DateFormatType;
  setDateFormat: (format: DateFormatType) => void;
  dateFormatLoading: boolean;
  dateFormatError: string | null;
  formatDate: (date: Date | string) => string;
}

const AVAILABLE_DATE_FORMATS: DateFormatType[] = [
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD",
];

export const CompanyTimezoneSection: React.FC<CompanyTimezoneSectionProps> = ({
  timezone = "Asia/Riyadh",
  handleTimezoneChange,
  currentTime,
  dateFormat,
  setDateFormat,
  dateFormatLoading,
  dateFormatError,
  formatDate,
}) => {
  return (
    <div className="bg-card shadow rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
        <ClockIcon className="h-6 w-6 text-primary me-2" />
        إعدادات الوقت والتاريخ
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="company-timezone"
            className="block text-sm font-medium text-foreground mb-2"
          >
            المنطقة الزمنية للشركة
          </label>
          <select
            id="company-timezone"
            name="timezone"
            autoComplete="off"
            value={timezone}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-card text-foreground"
          >
            <optgroup label="الخليج العربي">
              <option value="Asia/Riyadh">الرياض - السعودية (GMT+3)</option>
              <option value="Asia/Kuwait">الكويت (GMT+3)</option>
              <option value="Asia/Bahrain">البحرين (GMT+3)</option>
              <option value="Asia/Qatar">قطر (GMT+3)</option>
              <option value="Asia/Dubai">دبي - الإمارات (GMT+4)</option>
              <option value="Asia/Muscat">مسقط - عمان (GMT+4)</option>
            </optgroup>
            <optgroup label="الشام والعراق">
              <option value="Asia/Amman">عمّان - الأردن (GMT+3)</option>
              <option value="Asia/Beirut">بيروت - لبنان (GMT+2)</option>
              <option value="Asia/Damascus">دمشق - سوريا (GMT+3)</option>
              <option value="Asia/Baghdad">بغداد - العراق (GMT+3)</option>
              <option value="Asia/Jerusalem">القدس - فلسطين (GMT+2)</option>
            </optgroup>
            <optgroup label="شمال أفريقيا">
              <option value="Africa/Cairo">القاهرة - مصر (GMT+2)</option>
              <option value="Africa/Tripoli">طرابلس - ليبيا (GMT+2)</option>
              <option value="Africa/Tunis">تونس (GMT+1)</option>
              <option value="Africa/Algiers">الجزائر (GMT+1)</option>
              <option value="Africa/Casablanca">الدار البيضاء - المغرب (GMT+1)</option>
              <option value="Africa/Khartoum">الخرطوم - السودان (GMT+2)</option>
            </optgroup>
            <optgroup label="أخرى">
              <option value="UTC">توقيت عالمي (UTC)</option>
            </optgroup>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            سيتم استخدام هذا التوقيت في التقارير والحسابات اليومية
          </p>
        </div>
        <div>
          <span className="block text-sm font-medium text-foreground mb-2">
            توقيت الشركة الحالي
          </span>
          <div className="bg-gray-50 dark:bg-muted border border-border rounded-md p-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground dark:text-muted-foreground mb-1">
                الساعة الآن:
              </p>
              <p className="text-2xl font-mono font-bold text-primary tabular-nums">
                {formatTimeWithZone(currentTime, timezone)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-mono">
                {timezone}
              </p>
              <p className="text-xs font-medium text-foreground mt-1">
                {new Intl.DateTimeFormat("ar-EG", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: timezone,
                }).format(currentTime)}
              </p>
            </div>
          </div>
        </div>
        <div>
          <span className="block text-sm font-medium text-foreground mb-2">
            تنسيق التاريخ
          </span>
          <div className="space-y-2">
            {AVAILABLE_DATE_FORMATS.map((format) => (
              <label key={format} className="flex items-center cursor-pointer">
                <input
                  id={`company-date-format-${format.replace(/\//g, "-")}`}
                  type="radio"
                  name="dateFormat"
                  value={format}
                  checked={dateFormat === format}
                  onChange={(e) => setDateFormat(e.target.value as DateFormatType)}
                  disabled={dateFormatLoading}
                  className="h-4 w-4 text-primary focus:ring-primary border-border"
                />
                <span className="me-2 text-sm text-foreground">
                  {DATE_FORMAT_LABELS[format]}
                </span>
              </label>
            ))}
          </div>
          {dateFormatError && (
            <p className="text-xs text-destructive mt-1">{dateFormatError}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            التنسيق المختار: {DATE_FORMAT_LABELS[dateFormat] || dateFormat}
          </p>
        </div>
        <div>
          <span className="block text-sm font-medium text-foreground mb-2">
            معاينة التاريخ
          </span>
          <div className="bg-gray-50 dark:bg-muted rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">
              التاريخ الحالي:
            </div>
            <div className="text-lg font-semibold text-foreground font-mono tabular-nums">
              {formatDate(new Date())}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
