import React, { useState, useEffect } from "react";
import i18n from "../../i18n";
import {
  XMarkIcon,
  ShoppingCartIcon,
  PlusIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  TruckIcon,
  PhoneIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { config } from "../../config";
import tokenManager from "../../utils/tokenManager";
import { DateInput } from '../ui/DateInput';

interface ProductVariant {
  id: string;
  name: string;
  type: string;
  price: number | null;
  stock: number;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  stock: number;
  description?: string;
  variants?: ProductVariant[];
}

interface ShippingZone {
  id: string;
  governorates: string[];
  price: number;
  deliveryTime: string;
  isActive: boolean;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  variantId?: string;
  productColor?: string;
  productSize?: string;
  product?: Product;
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  conversationId: string;
  onOrderCreated: (orderData: any) => void;
}

const getAccessToken = (): string | null => tokenManager.getAccessToken();

const getAuthHeaders = (additionalHeaders: Record<string, string> = {}) =>
  tokenManager.createAuthHeaders(additionalHeaders);

const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  conversationId,
  onOrderCreated,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<OrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [deliveryTime, setDeliveryTime] = useState("");
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, { color?: string; size?: string }>
  >({});
  const [isScheduledOrder, setIsScheduledOrder] = useState(false);
  const [scheduledDeliveryDate, setScheduledDeliveryDate] = useState("");
  const [scheduledDeliveryTime, setScheduledDeliveryTime] = useState("");
  const [scheduledNotes, setScheduledNotes] = useState("");

  // تحميل المنتجات مع الـ variants
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${config.apiUrl}/products?limit=100`, {
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        // الـ variants جاية مع المنتجات من الـ backend مباشرة
        const transformedProducts = data.data.map((product: any) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images?.[0],
          stock: product.stock || 0,
          description: product.description || "",
          variants: product.variants || [],
        }));

        setProducts(transformedProducts);
        console.log("✅ تم تحميل المنتجات بنجاح:", transformedProducts.length);
      } else {
        setError("فشل في تحميل المنتجات");
        console.error("❌ فشل في تحميل المنتجات:", data);
      }
    } catch (error) {
      console.error("❌ خطأ في تحميل المنتجات:", error);
      setError("حدث خطأ أثناء تحميل المنتجات. تأكد من الاتصال بالإنترنت.");
    } finally {
      setLoading(false);
    }
  };

  // تحميل مناطق الشحن
  const loadShippingZones = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/shipping-zones`, {
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
      });
      const data = await response.json();
      if (data.success) {
        setShippingZones(data.data || []);
      }
    } catch (error) {
      console.error("❌ Error loading shipping zones:", error);
    }
  };

  // حساب تكلفة الشحن
  const calculateShipping = (city: string) => {
    if (!city) {
      setShippingCost(0);
      setDeliveryTime("");
      return;
    }

    const normalizedCity = city.trim().toLowerCase();
    const zone = shippingZones.find(
      (zone) =>
        zone.isActive &&
        zone.governorates.some(
          (gov) =>
            gov.toLowerCase().includes(normalizedCity) ||
            normalizedCity.includes(gov.toLowerCase()),
        ),
    );

    if (zone) {
      setShippingCost(Number(zone.price));
      setDeliveryTime(zone.deliveryTime);
    } else {
      setShippingCost(0);
      setDeliveryTime("");
    }
  };

  // معالجة تغيير المدينة
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    calculateShipping(city);
  };

  // الحصول على variants حسب النوع
  const getVariantsByType = (product: Product, type: string) => {
    return product.variants?.filter((v) => v.type === type && v.isActive) || [];
  };

  // إنشاء طلب من المحادثة
  const createOrderFromConversation = async () => {
    if (selectedProducts.length === 0) return;

    if (!selectedCity) {
      alert(i18n.t("OrderModal.msg_a03a"));
      return;
    }

    if (!customerPhone) {
      alert(i18n.t("OrderModal.msg_f4e5"));
      return;
    }

    try {
      setCreatingOrder(true);

      if (!getAccessToken()) {
        alert(i18n.t("OrderModal.msg_f9fe"));
        return;
      }

      // ✨ Logging للبيانات قبل الإرسال
      console.log(
        "🔍 [FRONTEND-DEBUG] Selected products before sending:",
        selectedProducts.map((item) => ({
          productName: item.productName,
            productColor: item.productColor ? String(item.productColor) : null,
            productSize: item.productSize != null ? String(item.productSize) : null,
          variantId: item.variantId,
        })),
      );

      const scheduledDateTime =
        isScheduledOrder && scheduledDeliveryDate
          ? new Date(
              `${scheduledDeliveryDate}${scheduledDeliveryTime ? "T" + scheduledDeliveryTime : "T00:00:00"}`,
            ).toISOString()
          : null;

      const orderData = {
        customerId,
        conversationId,
        isScheduled: isScheduledOrder,
        scheduledDeliveryDate: scheduledDateTime,
        scheduledNotes: isScheduledOrder ? scheduledNotes : undefined,
        items: selectedProducts.map((item) => {
          console.log("🔍 [FRONTEND-DEBUG] Mapping item:", {
            productName: item.productName,
            productColor: item.productColor,
            productSize: item.productSize,
            variantId: item.variantId,
          });

          return {
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            productName: item.productName,
            productColor: item.productColor ? String(item.productColor) : null,
            productSize: item.productSize != null ? String(item.productSize) : null,
          };
        }),
        subtotal: calculateSubtotal(),
        shipping: shippingCost,
        total: calculateTotal(),
        city: selectedCity,
        customerPhone,
        shippingAddress: shippingAddress.trim() || undefined,
        notes: orderNotes.trim() || undefined,
        metadata: JSON.stringify({
          deliveryTime,
          shippingZone: shippingZones.find((z) =>
            z.governorates.some((g) =>
              g.toLowerCase().includes(selectedCity.toLowerCase()),
            ),
          )?.id,
        }),
      };

      console.log(
        "✅ [FRONTEND-DEBUG] Final orderData being sent:",
        JSON.stringify(orderData, null, 2),
      );

      const response = await fetch(`${config.apiUrl}/orders-new/simple`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (data.success) {
        setOrderSuccess(true);
        onOrderCreated(data.data);

        setTimeout(() => {
          setOrderSuccess(false);
          handleClose();
        }, 2000);
      } else {
        alert("فشل في إنشاء الطلب: " + (data.error || i18n.t("OrderModal.msg_fe97")));
        console.log(data.error);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert(i18n.t("OrderModal.failed_create_ff97"));
    } finally {
      setCreatingOrder(false);
    }
  };

  // إضافة منتج للطلب
  const addProductToOrder = (product: Product) => {
    const existingItem = selectedProducts.find(
      (item) => item.productId === product.id,
    );

    if (existingItem) {
      setSelectedProducts((prev) =>
        prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price,
              }
            : item,
        ),
      );
    } else {
      // ✨ استخراج اللون والمقاس من الـ variants تلقائياً
      const colorVariants =
        product.variants?.filter((v) => v.type === "color" && v.isActive) || [];
      const sizeVariants =
        product.variants?.filter((v) => v.type === "size" && v.isActive) || [];

      let productColor: string | undefined;
      let productSize: string | undefined;
      let variantId: string | undefined;
      let finalPrice = product.price;

      // إذا كان هناك variant واحد فقط للون، استخدمه تلقائياً
      if (colorVariants.length === 1 && colorVariants[0]) {
        productColor = colorVariants[0].name;
        variantId = colorVariants[0].id;
        if (colorVariants[0].price) {
          finalPrice = colorVariants[0].price;
        }
        // حفظ في selectedVariants
        setSelectedVariants((prev) => ({
          ...prev,
          [product.id]: { ...prev[product.id], color: colorVariants[0]?.id },
        }));
      }

      // إذا كان هناك variant واحد فقط للمقاس، استخدمه تلقائياً
      if (sizeVariants.length === 1 && sizeVariants[0]) {
        productSize = sizeVariants[0].name;
        if (!variantId) variantId = sizeVariants[0].id;
        // حفظ في selectedVariants
        setSelectedVariants((prev) => ({
          ...prev,
          [product.id]: { ...prev[product.id], size: sizeVariants[0]?.id },
        }));
      }

      // ✨ إذا لم نحصل على لون ومقاس من variants، استخرجهما من اسم المنتج
      if (!productColor || !productSize) {
        console.log(
          `🔍 [AUTO-EXTRACT] Extracting from product name: ${product.name}`,
          {
            hasColorVariants: colorVariants.length,
            hasSizeVariants: sizeVariants.length,
            currentColor: productColor,
            currentSize: productSize,
          },
        );

        // محاولة استخراج المقاس من اسم المنتج
        if (!productSize) {
          const sizeMatch = product.name.match(
            /(\d+\/\d+|\d+\-\d+|\b\d{2,3}\b)/,
          );
          if (sizeMatch) {
            productSize = sizeMatch[0];
            console.log(`   ✅ Extracted size: ${productSize}`);
          }
        }

        // محاولة استخراج اللون من اسم المنتج
        if (!productColor) {
          const colorPatterns = [
            "أسود",
            "أبيض",
            "أحمر",
            "أزرق",
            "أخضر",
            "أصفر",
            "بني",
            "رمادي",
            "وردي",
            "بنفسجي",
            "black",
            "white",
            "red",
            "blue",
            "green",
            "yellow",
            "brown",
            "gray",
            "grey",
            "pink",
            "purple",
            "بيج",
            "كحلي",
            "سماوي",
            "برتقالي",
            "فضي",
            "ذهبي",
            "نيلي",
            "بورجوندي",
            "كريمي",
          ];

          for (const color of colorPatterns) {
            if (product.name.toLowerCase().includes(color.toLowerCase())) {
              productColor = color;
              console.log(`   ✅ Extracted color: ${productColor}`);
              break;
            }
          }

          // إذا لم نجد لون، جرب استخراج من الكلمة الأولى أو الثانية
          if (!productColor) {
            const words = product.name.split(" ");
            // ابحث عن كلمات قد تكون ألوان (كلمات قصيرة غير أرقام)
            for (const word of words) {
              if (word.length >= 3 && word.length <= 10 && !/\d/.test(word)) {
                // قد تكون هذه كلمة لون
                const possibleColor = word.trim();
                if (
                  possibleColor &&
                  !["هاف", "فرو", "شو", "حذاء", "جزمة", "UGG", "ugg"].includes(
                    possibleColor,
                  )
                ) {
                  productColor = possibleColor;
                  console.log(
                    `   ℹ️ Possible color from word: ${productColor}`,
                  );
                  break;
                }
              }
            }
          }
        }
      }

      console.log(`🔍 [ADD-PRODUCT] Adding product:`, {
        name: product.name,
        hasColorVariants: colorVariants.length,
        hasSizeVariants: sizeVariants.length,
        extractedColor: productColor,
        extractedSize: productSize,
      });

      setSelectedProducts((prev) => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: finalPrice,
          total: finalPrice,
          productColor,
          productSize,
          variantId,
          product: product, // حفظ المنتج كامل للوصول للـ variants
        },
      ]);
    }
  };

  // إزالة منتج من الطلب
  const removeProductFromOrder = (index: number) => {
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
  };

  // تحديث كمية المنتج
  const updateProductQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeProductFromOrder(index);
      return;
    }

    setSelectedProducts((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity, total: quantity * item.price }
          : item,
      ),
    );
  };

  // حساب إجمالي المنتجات
  const calculateSubtotal = () => {
    return selectedProducts.reduce((total, item) => total + item.total, 0);
  };

  // حساب الإجمالي الكلي
  const calculateTotal = () => {
    return calculateSubtotal() + shippingCost;
  };

  // إغلاق المودال وإعادة تعيين البيانات
  const handleClose = () => {
    setSelectedProducts([]);
    setOrderNotes("");
    setShippingAddress("");
    setSelectedCity("");
    setCustomerPhone("");
    setShippingCost(0);
    setDeliveryTime("");
    setOrderSuccess(false);
    setSelectedVariants({});
    setIsScheduledOrder(false);
    setScheduledDeliveryDate("");
    setScheduledDeliveryTime("");
    setScheduledNotes("");
    onClose();
  };

  // تحميل البيانات عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      loadProducts();
      loadShippingZones();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border dark:dark:border-border">
          <div className="flex items-center gap-3">
            <ShoppingCartIcon className="h-6 w-6 text-success dark:text-success" />
            <h2 className="text-xl font-semibold text-foreground">
              إنشاء طلب جديد
            </h2>
            <span className="text-sm text-muted-foreground">
              للعميل: {customerName}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-full"
          >
            <XMarkIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex h-[70vh]">
          {/* قائمة المنتجات */}
          <div className="w-1/2 p-6 border-r border-border dark:dark:border-border overflow-y-auto">
            <h3 className="text-lg font-medium text-foreground mb-4">
              اختر المنتجات
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-muted-foreground/80" />
                <span className="ms-2 text-muted-foreground">
                  جاري تحميل المنتجات...
                </span>
              </div>
            ) : error ? (
              <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive dark:border-destructive rounded-lg p-4 text-center">
                <p className="text-destructive dark:text-destructive mb-2">{error}</p>
                <button
                  onClick={loadProducts}
                  className="text-sm text-destructive dark:text-destructive hover:text-destructive dark:hover:text-destructive underline"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">
                  لا توجد منتجات متاحة
                </p>
                <p className="text-sm text-muted-foreground/80">
                  قم بإضافة منتجات أولاً من صفحة المنتجات
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="border border-border dark:dark:border-border rounded-lg p-4 hover:border-success dark:hover:border-success transition-colors bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">
                          {product.name}
                        </h4>
                        <p className="text-sm text-foreground dark:dark:text-muted-foreground mt-1">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-lg font-semibold text-success dark:text-success">
                            {product.price} جنيه
                          </span>
                          <span className="text-sm text-muted-foreground">
                            المخزون: {product.stock}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => addProductToOrder(product)}
                        disabled={product.stock === 0}
                        className="ms-4 p-2 bg-success dark:bg-success text-white rounded-full hover:bg-success dark:hover:bg-success disabled:disabled:bg-muted dark:disabled:dark:disabled:bg-muted disabled:cursor-not-allowed"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* تفاصيل الطلب */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <h3 className="text-lg font-medium text-foreground mb-4">
              تفاصيل الطلب
            </h3>

            {/* المنتجات المختارة */}
            <div className="space-y-3 mb-6">
              {selectedProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  لم يتم اختيار أي منتجات بعد
                </p>
              ) : (
                selectedProducts.map((item, index) => {
                  const colorVariants = getVariantsByType(
                    item.product!,
                    "color",
                  );
                  const sizeVariants = getVariantsByType(item.product!, "size");
                  const selectedVariant =
                    selectedVariants[item.productId] || {};

                  return (
                    <div
                      key={index}
                      className="bg-muted dark:dark:bg-muted rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">
                            {item.productName}
                          </h4>

                          {/* Variants Selection */}
                          {(colorVariants.length > 0 ||
                            sizeVariants.length > 0) && (
                            <div className="flex gap-2 mt-2">
                              {colorVariants.length > 0 && (
                                <select
                                  value={selectedVariant.color || ""}
                                  onChange={(e) => {
                                    const variant = colorVariants.find(
                                      (v) => v.id === e.target.value,
                                    );
                                    setSelectedVariants((prev) => ({
                                      ...prev,
                                      [item.productId]: {
                                        ...prev[item.productId],
                                        color: e.target.value,
                                      },
                                    }));
                                    // تحديث السعر واللون والـ variantId
                                    if (variant) {
                                      setSelectedProducts((prev) =>
                                        prev.map((p, i) =>
                                          i === index
                                            ? {
                                                ...p,
                                                price: variant.price || p.price,
                                                total:
                                                  (variant.price || p.price) *
                                                  p.quantity,
                                                productColor: variant.name,
                                                variantId: variant.id,
                                              }
                                            : p,
                                        ),
                                      );
                                    }
                                  }}
                                  className="flex-1 text-xs border border-border rounded px-2 py-1 focus:ring-2 focus:ring-success dark:dark:bg-muted dark:dark:text-muted-foreground"
                                >
                                  <option value="">اختر اللون</option>
                                  {colorVariants.map((variant) => (
                                    <option key={variant.id} value={variant.id}>
                                      {variant.name}{" "}
                                      {variant.price
                                        ? `(${variant.price} ج.م)`
                                        : ""}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {sizeVariants.length > 0 && (
                                <select
                                  value={selectedVariant.size || ""}
                                  onChange={(e) => {
                                    const variant = sizeVariants.find(
                                      (v) => v.id === e.target.value,
                                    );
                                    setSelectedVariants((prev) => ({
                                      ...prev,
                                      [item.productId]: {
                                        ...prev[item.productId],
                                        size: e.target.value,
                                      },
                                    }));
                                    // حفظ اسم المقاس والـ variantId
                                    if (variant) {
                                      setSelectedProducts((prev) =>
                                        prev.map((p, i) =>
                                          i === index
                                            ? {
                                                ...p,
                                                productSize: variant.name,
                                                variantId: variant.id,
                                              }
                                            : p,
                                        ),
                                      );
                                    }
                                  }}
                                  className="flex-1 text-xs border border-border rounded px-2 py-1 focus:ring-2 focus:ring-success dark:dark:bg-muted dark:dark:text-muted-foreground"
                                >
                                  <option value="">اختر المقاس</option>
                                  {sizeVariants.map((variant) => (
                                    <option key={variant.id} value={variant.id}>
                                      {variant.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto max-w-full mt-2">
                            {item.productColor && (
                              <span className="text-[11px] font-semibold bg-primary dark:bg-primary/20 text-primary dark:text-primary px-2 py-0.5 rounded whitespace-nowrap shrink-0">
                                🎨 {item.productColor}
                              </span>
                            )}
                            {item.productSize && (
                              <span className="text-[11px] font-semibold bg-primary dark:bg-primary/20 text-primary dark:text-primary px-2 py-0.5 rounded whitespace-nowrap shrink-0">
                                📏 {item.productSize}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground dark:dark:text-muted-foreground mt-1">
                            {item.price} جنيه × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                updateProductQuantity(index, item.quantity - 1)
                              }
                              className="w-6 h-6 bg-muted dark:dark:bg-muted rounded text-muted-foreground hover:hover:bg-muted dark:hover:dark:hover:bg-muted"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-foreground">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateProductQuantity(index, item.quantity + 1)
                              }
                              className="w-6 h-6 bg-muted dark:dark:bg-muted rounded text-muted-foreground hover:hover:bg-muted dark:hover:dark:hover:bg-muted"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-semibold text-success dark:text-success w-20 text-right">
                            {item.total} جنيه
                          </span>
                          <button
                            onClick={() => removeProductFromOrder(index)}
                            className="p-1 text-destructive dark:text-destructive hover:text-destructive dark:hover:text-destructive"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* رقم الهاتف */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                <PhoneIcon className="h-4 w-4 inline ms-1" />
                رقم الهاتف{" "}
                <span className="text-destructive dark:text-destructive">*</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-success focus:border-transparent dark:dark:bg-muted dark:dark:text-muted-foreground dark:dark:placeholder-muted"
                placeholder="01xxxxxxxxx"
                required
              />
            </div>

            {/* المدينة */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                <TruckIcon className="h-4 w-4 inline ms-1" />
                المدينة / المحافظة{" "}
                <span className="text-destructive dark:text-destructive">*</span>
              </label>
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-success focus:border-transparent dark:dark:bg-muted dark:dark:text-muted-foreground"
                required
              >
                <option value="">اختر المدينة</option>
                {(() => {
                  const uniqueCities = new Map();
                  shippingZones.forEach((zone) => {
                    zone.governorates.forEach((gov) => {
                      const normalizedCity = gov.trim().toLowerCase();
                      if (!uniqueCities.has(normalizedCity)) {
                        uniqueCities.set(normalizedCity, {
                          name: gov,
                          price: zone.price,
                          deliveryTime: zone.deliveryTime,
                        });
                      }
                    });
                  });
                  return Array.from(uniqueCities.values()).map((city, idx) => (
                    <option key={idx} value={city.name}>
                      {city.name} - {city.price} ج.م ({city.deliveryTime})
                    </option>
                  ));
                })()}
              </select>
            </div>

            {/* عنوان الشحن */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                عنوان الشحن التفصيلي
              </label>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-success focus:border-transparent dark:dark:bg-muted dark:dark:text-muted-foreground dark:dark:placeholder-muted"
                rows={2}
                placeholder="الشارع، رقم المبنى، معالم مميزة..."
              />
            </div>

            {/* ملاحظات */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                ملاحظات إضافية
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-success focus:border-transparent dark:dark:bg-muted dark:dark:text-muted-foreground dark:dark:placeholder-muted"
                rows={2}
                placeholder="أي ملاحظات خاصة بالطلب..."
              />
            </div>

            {/* الطلب المجدول */}
            <div className="mb-6 bg-warning/10 dark:bg-warning/10 border border-warning dark:border-warning rounded-lg p-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScheduledOrder}
                  onChange={(e) => setIsScheduledOrder(e.target.checked)}
                  className="w-4 h-4 text-warning bg-muted border-border rounded focus:ring-warning dark:focus:ring-warning dark:ring-offset-gray-800 focus:ring-2 dark:dark:bg-muted dark:dark:border-border"
                />
                <CalendarIcon className="h-5 w-5 text-warning dark:text-warning" />
                <span className="text-sm font-medium text-foreground">
                  طلب مجدول (استلام في وقت محدد)
                </span>
              </label>

              {isScheduledOrder && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        تاريخ الاستلام <span className="text-destructive">*</span>
                      </label>
                      <DateInput
                        value={scheduledDeliveryDate}
                        onChange={(e) =>
                          setScheduledDeliveryDate(e.target.value)
                        }
                        min={
                          new Date(Date.now() + 24 * 60 * 60 * 1000)
                            .toISOString()
                            .split("T")[0]
                        }
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-warning focus:border-transparent dark:dark:bg-muted dark:dark:text-muted-foreground"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        وقت الاستلام (اختياري)
                      </label>
                      <input
                        type="time"
                        value={scheduledDeliveryTime}
                        onChange={(e) =>
                          setScheduledDeliveryTime(e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-warning focus:border-transparent dark:dark:bg-muted dark:dark:text-muted-foreground"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      ملاحظات الجدولة
                    </label>
                    <textarea
                      value={scheduledNotes}
                      onChange={(e) => setScheduledNotes(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-warning focus:border-transparent dark:dark:bg-muted dark:dark:text-muted-foreground dark:dark:placeholder-muted"
                      rows={2}
                      placeholder="مثال: عيد ميلاد - يرجى التغليف الخاص"
                    />
                  </div>
                  <div className="flex items-start gap-2 text-xs text-warning dark:text-warning">
                    <CalendarIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      سيتم تحويل الطلب تلقائياً للحالة التالية عند حلول الموعد
                      المحدد
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ملخص الطلب */}
            {selectedProducts.length > 0 && (
              <div className="border-t border-border dark:dark:border-border pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground dark:dark:text-muted-foreground">
                    إجمالي المنتجات:
                  </span>
                  <span className="font-medium text-foreground">
                    {calculateSubtotal()} جنيه
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground dark:dark:text-muted-foreground">
                    تكلفة الشحن:
                  </span>
                  <span className="font-medium text-foreground">
                    {shippingCost > 0 ? `${shippingCost} جنيه` : "اختر المدينة"}
                  </span>
                </div>
                {deliveryTime && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>مدة التوصيل:</span>
                    <span>{deliveryTime}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-lg font-bold border-t border-border dark:dark:border-border pt-2">
                  <span className="text-foreground">
                    الإجمالي الكلي:
                  </span>
                  <span className="text-success dark:text-success">
                    {calculateTotal()} جنيه
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border dark:dark:border-border bg-muted dark:dark:bg-muted">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-foreground bg-card border border-border rounded-lg hover:bg-muted/50"
          >
            إلغاء
          </button>

          {orderSuccess ? (
            <div className="flex items-center gap-2 text-success dark:text-success">
              <CheckCircleIcon className="h-5 w-5" />
              <span>تم إنشاء الطلب بنجاح!</span>
            </div>
          ) : (
            <button
              onClick={createOrderFromConversation}
              disabled={selectedProducts.length === 0 || creatingOrder}
              className="flex items-center gap-2 px-6 py-2 bg-success dark:bg-success text-white rounded-lg hover:bg-success dark:hover:bg-success disabled:disabled:bg-muted dark:disabled:dark:disabled:bg-muted disabled:cursor-not-allowed"
            >
              {creatingOrder ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <ShoppingCartIcon className="h-4 w-4" />
                  إنشاء الطلب ({selectedProducts.length} منتج)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
