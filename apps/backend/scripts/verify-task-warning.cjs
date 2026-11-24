const B = "https://maxp.online/api/v1";
(async () => {
  const l = await fetch(B + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "trial.owner@maxp.test", password: "Maxp@2026" }) });
  const t = (await l.json()).data.token;
  const tk = await fetch(B + "/tasks", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + t }, body: JSON.stringify({ title: "مهمة تحقق التحذير", description: "اختبار", priority: "LOW", status: "TODO" }) });
  const tj = await tk.json();
  const id = tj?.data?.id;
  console.log("created", tk.status, id, (tj?.error || "").slice(0, 60));
  if (id) {
    const up = await fetch(B + "/tasks/" + id, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: "Bearer " + t }, body: JSON.stringify({ title: "مهمة تحقق التحذير 2", status: "IN_PROGRESS" }) });
    const uj = await up.json();
    console.log("update", up.status, "warnings", JSON.stringify(uj.warnings));
    const del = await fetch(B + "/tasks/" + id, { method: "DELETE", headers: { Authorization: "Bearer " + t } });
    console.log("cleanup", del.status);
  }
})();
