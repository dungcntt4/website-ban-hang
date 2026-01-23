import { useState, useRef, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
function Chatbot() {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [products, setProducts] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const chatRef = useRef(null);
  const buttonRef = useRef(null);

  const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GOOGLE_GENAI_KEY,
  });
  useEffect(() => {
    const fetchChatbotProducts = async () => {
      try {
        const res = await fetch(
          "http://localhost:8080/api/public/products/chatbot"
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Không tải được dữ liệu chatbot:", err);
      }
    };

    fetchChatbotProducts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        chatRef.current &&
        !chatRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setShowChat(false);
      }
    };

    if (showChat) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showChat]);

  useEffect(() => {
    if (showChat && messages.length === 0) {
      setMessages([
        { sender: "bot", text: "Chào bạn, tôi có thể giúp gì được cho bạn?" },
      ]);
    }
  }, [showChat]);

  const sendMessage = async () => {
    if (!input) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    const productData = products.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      slug: p.slug,
      priceMin: p.priceMin,
      salePriceMin: p.salePriceMin,
      categories: p.categories,
      variants: p.variants,
      specifications: p.specifications,
    }));

    const finalPrompt = `
Bạn là trợ lý bán hàng của Dũng Computer – hệ thống bán máy tính và linh kiện chính hãng tại Việt Nam.

THÔNG TIN CỬA HÀNG:
- Địa chỉ: Thôn Yên Quán, xã Hưng Đạo, huyện Quốc Oai, TP. Hà Nội
- Website: www.dtech.vn
- Hotline: 0123 456 789
- Giờ mở cửa: 8h – 21h hàng ngày

VAI TRÒ CỦA BẠN:
- Bạn là nhân viên tư vấn bán hàng, không phải AI tổng quát
- Nhiệm vụ chính: giúp khách chọn đúng sản phẩm phù hợp nhu cầu và ngân sách

DANH SÁCH SẢN PHẨM (CHỈ ĐƯỢC DÙNG DANH SÁCH NÀY, KHÔNG IN RA NGUYÊN DỮ LIỆU):
${JSON.stringify(productData, null, 2)}

QUY TẮC BẮT BUỘC:
- CHỈ được tư vấn dựa trên danh sách sản phẩm ở trên
- TUYỆT ĐỐI KHÔNG bịa tên sản phẩm, giá tiền hoặc cấu hình
- KHÔNG suy đoán ngoài dữ liệu đã cung cấp
- Nếu KHÔNG có sản phẩm phù hợp → nói rõ là hiện chưa có sản phẩm đáp ứng
- Không nhắc đến từ “AI”, “dữ liệu”, “JSON” hay “hệ thống”

YÊU CẦU BUILD TRỌN BỘ (BẮT BUỘC):
- Khi khách yêu cầu "build máy", "mua máy", "chơi game", "build"
→ PHẢI tư vấn TRỌN BỘ GỒM:
  1. 01 PC / Case
  2. 01 Màn hình
  3. 01 Bàn phím
  4. 01 Chuột

- PHẢI cộng TỔNG GIÁ
- TỔNG GIÁ KHÔNG ĐƯỢC VƯỢT NGÂN SÁCH
- KHÔNG được chỉ tư vấn riêng PC
- Nếu KHÔNG đủ sản phẩm → báo không đáp ứng


CÁCH TƯ VẤN:
1. Phân tích nhu cầu của khách:
   - Văn phòng / học tập
   - Lập trình
   - Gaming
   - Đồ họa – thiết kế
2. Giải thích cấu hình bằng ngôn ngữ dễ hiểu:
   - CPU: quyết định tốc độ xử lý
   - RAM: ảnh hưởng khả năng đa nhiệm
   - SSD: tốc độ khởi động và mở ứng dụng
   - GPU: quan trọng cho gaming và đồ họa
3. Nếu khách có ngân sách:
   - Chỉ tư vấn sản phẩm có giá trong ngân sách
4. Nếu khách chưa nói rõ nhu cầu:
   - Hỏi lại ngắn gọn 1–2 câu để làm rõ

PHONG CÁCH TRẢ LỜI:
- Lịch sự, thân thiện, giống nhân viên bán hàng thật
- Trình bày rõ ràng, không quá dài
- Có thể kết thúc bằng gợi ý liên hệ hotline hoặc website
BẮT BUỘC PHẢI TRẢ VỀ DUY NHẤT 1 JSON HỢP LỆ.
KHÔNG được viết thêm bất kỳ chữ nào ngoài JSON.

FORMAT TRẢ LỜI CHÍNH XÁC:
{
  "answer": "Nội dung tư vấn cho khách",
  "recommendedProductIds": ["UUID_1", "UUID_2"]
}

QUY TẮC:
- recommendedProductIds PHẢI là id có trong danh sách sản phẩm đã cho
- Chỉ chọn sản phẩm PHÙ HỢP nhu cầu & ngân sách
- Nếu không có sản phẩm phù hợp → recommendedProductIds = []
- TUYỆT ĐỐI KHÔNG bịa ID
- KHÔNG giải thích ngoài JSON

CÂU HỎI CỦA KHÁCH:
"${input}"
`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: finalPrompt,
      });

      const raw = response.text;

      let parsed = {
        answer: raw,
        recommendedProductIds: [],
      };

      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch (e) {
          console.error("Parse JSON failed", e);
        }
      }

      const relatedProducts = products.filter((p) =>
        parsed.recommendedProductIds?.includes(p.id)
      );

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: parsed.answer,
          products: relatedProducts,
        },
      ]);
    } catch (err) {
      console.error("Gemini SDK error:", err);
    }

    setInput("");
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setShowChat(!showChat)}
        className="btn position-fixed bottom-0 end-0 m-4 rounded-circle shadow"
        style={{
          width: "48px",
          height: "48px",
          zIndex: 1050,
          backgroundColor: "#ede734",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {!showChat ? (
          <i className="fas fa-comment text-dark"></i>
        ) : (
          <i className="fas fa-chevron-down text-dark"></i>
        )}
      </button>

      {showChat && (
        <div
          ref={chatRef}
          style={{
            position: "fixed",
            bottom: "80px",
            right: "20px",
            width: "360px",
            height: "470px",
            zIndex: 1051,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            borderRadius: "12px",
            backgroundColor: "#fff",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "'Segoe UI', sans-serif",
            border: "1px solid #ddd",
          }}
        >
          <div
            style={{
              padding: "12px",
              backgroundColor: "#f5f5f5",
              borderBottom: "1px solid #ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontWeight: "bold" }}>Trợ lý ảo D-Tech</div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "10px",
              background: "#fafafa",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    backgroundColor:
                      msg.sender === "user" ? "#ede734" : "#e6e6e6",
                    borderRadius: "18px",
                    padding: "10px 15px",
                    maxWidth: "80%",
                    wordBreak: "break-word",
                    textAlign: "left",
                  }}
                >
                  {msg.text}
                </div>

                {msg.products?.length > 0 &&
                  msg.products.map((product) => (
                    <div
                      key={product.id}
                      style={{
                        marginTop: "8px",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        background: "#fff",
                        maxWidth: "80%",
                      }}
                    >
                      <a href={`/products/detail/${product.slug}?productId=${product.id}`}>
                        <img
                          src={product.thumbnailUrl}
                          alt={product.name}
                          style={{
                            width: "100%",
                            borderRadius: "6px",
                            marginBottom: "6px",
                            objectFit: "cover",
                          }}
                        />
                        <div>
                          <b>{product.name}</b>
                        </div>
                        <div>Thương hiệu: {product.brand}</div>
                        <div>Danh mục: {product.categories?.join(", ")}</div>

                        <div>
                          {product.salePriceMin ? (
                            <>
                              <span
                                style={{ color: "red", fontWeight: "bold" }}
                              >
                                {Number(product.salePriceMin).toLocaleString(
                                  "vi-VN"
                                )}
                                ₫
                              </span>
                              <span
                                style={{
                                  textDecoration: "line-through",
                                  color: "#888",
                                  marginLeft: "5px",
                                }}
                              >
                                {Number(product.priceMin).toLocaleString(
                                  "vi-VN"
                                )}
                                ₫
                              </span>
                            </>
                          ) : (
                            <>
                              Giá:{" "}
                              {Number(product.priceMin).toLocaleString("vi-VN")}
                              ₫
                            </>
                          )}
                        </div>
                      </a>
                    </div>
                  ))}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              padding: "10px",
              borderTop: "1px solid #ddd",
              backgroundColor: "#fff",
              alignItems: "center",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi tại đây..."
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: "20px",
                border: "1px solid #ccc",
                outline: "none",
                fontSize: "14px",
                backgroundColor: "#fff",
                color: "#000",
                boxShadow: "none",
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                background: "transparent",
                border: "none",
                marginLeft: "8px",
                cursor: "pointer",
              }}
            >
              <i
                className="fas fa-paper-plane"
                style={{ color: "#555", fontSize: "18px" }}
              ></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;
