import React from "react";

const ConversationsTest: React.FC = () => {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          🚀 اختبار الصفحة المحسنة
        </h1>
        <div className="space-y-4">
          <div className="p-4 bg-success/10 border border-success rounded-lg">
            <h2 className="text-lg font-semibold text-success mb-2">
              ✅ الصفحة تعمل بنجاح!
            </h2>
            <p className="text-green-700">
              إذا كنت ترى هذه الرسالة، فهذا يعني أن التوجيه يعمل بشكل صحيح.
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              📋 الخطوات التالية:
            </h3>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>التأكد من تحميل المحادثات من الـ API</li>
              <li>إضافة الميزات المتقدمة تدريجياً</li>
              <li>اختبار Socket.IO والرسائل الفورية</li>
            </ul>
          </div>

          <div className="p-4 bg-warning/10 border border-warning rounded-lg">
            <h3 className="text-lg font-semibold text-warning mb-2">
              🔧 معلومات تقنية:
            </h3>
            <p className="text-yellow-700">
              الرابط الحالي:{" "}
              <code className="bg-yellow-100 px-2 py-1 rounded">
                /conversations-test
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationsTest;
