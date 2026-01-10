import { useState, useRef, useEffect } from "react";

function Chatbot() {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [products, setProducts] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const chatRef = useRef(null);
  const buttonRef = useRef(null);
  const GEMINI_API =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=AIzaSyA7rGwSH3HisHQv2fNi5afUWz5-ex621Q0";

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

  const sendMessage = () => {
    if (!input) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    const productData = products.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      priceMin: p.priceMin,
      salePriceMin: p.salePriceMin,
      categories: p.categories,
      variants: p.variants,
      specifications: p.specifications,
    }));

    const finalPrompt = `
Bạn là trợ lý tư vấn bán máy tính và linh kiện.

DỮ LIỆU SẢN PHẨM bên dưới là DANH SÁCH DUY NHẤT bạn được phép sử dụng.
KHÔNG được bịa, KHÔNG suy đoán.

CÁCH TƯ VẤN:
- Phân tích nhu cầu: học tập, văn phòng, gaming, đồ họa, lập trình
- Giải thích CPU, RAM, SSD, GPU dễ hiểu
- Nếu có ngân sách, chỉ tư vấn trong ngân sách
- Nếu thiếu thông tin, hỏi lại khách

FORMAT TRẢ LỜI (JSON):
{
  "answer": "nội dung tư vấn",
  "recommendedProductIds": ["id1", "id2"]
}

DANH SÁCH SẢN PHẨM (KHÔNG IN RA):
${JSON.stringify(productData, null, 2)}

CÂU HỎI KHÁCH:
"${input}"
`;

    fetch(GEMINI_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] }),
    })
      .then((res) => res.json())
      .then((data) => {
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(raw);

        const relatedProducts = products.filter((p) =>
          parsed.recommendedProductIds.includes(p.id)
        );

        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: parsed.answer,
            products: relatedProducts,
          },
        ]);
      })

      .catch(() => {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Đã xảy ra lỗi khi liên hệ trợ lý." },
        ]);
      });

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
            <div style={{ fontWeight: "bold" }}>Trợ lý ảo Huân Sports</div>
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
                      <a href={`/products/detail/${product.id}`}>
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
