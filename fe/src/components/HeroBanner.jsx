import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const FALLBACK_COLLECTIONS = [
  {
    id: "mock-1",
    name: "Laptop Gaming Hiệu Năng Cao",
    description:
      "Chiến mọi tựa game với CPU mạnh mẽ, GPU rời và hệ thống tản nhiệt tối ưu.",
    imageUrl:
      "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/2022_4_5_637847779904332860_pc-la-gi.jpg",
    status: "VISIBLE",
    link: "/products/gaming",
  },
  {
    id: "mock-2",
    name: "PC Văn Phòng Tiết Kiệm",
    description:
      "Cấu hình tối ưu cho công việc, học tập, tiết kiệm chi phí, bền bỉ hàng ngày.",
    imageUrl:
      "https://cdn2.fptshop.com.vn/unsafe/Uploads/images/tin-tuc/144146/Originals/toc-do-xu-li-du-lieu-cao.jpg",
    status: "VISIBLE",
    link: "/collections/pc-van-phong",
  },
  {
    id: "mock-3",
    name: "Màn Hình & Phụ Kiện",
    description:
      "Không gian làm việc và giải trí hoàn hảo với màn hình lớn, chuột phím, tai nghe.",
    imageUrl:
      "https://cdn2.fptshop.com.vn/unsafe/Uploads/images/tin-tuc/144146/Originals/luu-tru-tuyet-doi.jpg",
    status: "VISIBLE",
    link: "/collections/phu-kien",
  },
];


function HeroBanner() {
  const [collections, setCollections] = useState(FALLBACK_COLLECTIONS);
  const navigate = useNavigate();
  const visibleCollections = collections.filter(
    (collection) => collection.status === "VISIBLE"
  );

  return (
    <section className="m-0 p-0">
      {visibleCollections.length > 0 && (
        <Swiper
          modules={[Pagination, Autoplay, Navigation]}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          navigation
          loop
          style={{ width: "100vw", height: "100vh" }}
        >
          {visibleCollections.map((collection) => (
            <SwiperSlide key={collection.id}>
              <div className="position-relative w-100 h-100">
                {/* Lớp overlay đen → trong suốt */}
                <div
                  className="position-absolute top-0 start-0 w-100 h-100"
                  style={{
                    background:
                      "linear-gradient(to right, rgba(0,0,0,0.9), transparent)",
                    zIndex: 10,
                  }}
                ></div>

                {/* Background image */}
                <img
                  src={
                    collection.imageUrl ||
                    "https://via.placeholder.com/1600x900?text=Collection"
                  }
                  alt={collection.name}
                  className="position-absolute top-0 start-0 w-100 h-100"
                  style={{
                    objectFit: "cover",
                    objectPosition: "top",
                    zIndex: 5,
                  }}
                />

                {/* Text content */}
                <div
                  className="position-absolute top-0 start-0 h-100 d-flex align-items-center"
                  style={{ zIndex: 20 }}
                >
                  <div className="text-white p-5" style={{ maxWidth: "600px" }}>
                    <h2 className="display-5 fw-bold mb-3">
                      {collection.name}
                    </h2>
                    <p className="lead mb-4">{collection.description}</p>
                    <div className="d-flex gap-3">
                      <button
                        className="btn btn-warning fw-semibold px-4 py-2 rounded-pill"
                        style={{ backgroundColor: "#ede734", border: "none" }}
                        onClick={() =>
                          navigate(`${collection.link}`)
                        }
                      >
                        Khám phá ngay
                      </button>
                      <button
                        className="btn btn-light fw-semibold px-4 py-2 rounded-pill border border-white"
                        onClick={() =>
                          navigate(`${collection.link}`)
                        }
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      <style>
        {`
          .swiper-button-next {
            padding-right: 10px;
            color: #ede734;
          }
          .swiper-button-prev {
            color: #ede734;
          }
        `}
      </style>
    </section>
  );
}

export default HeroBanner;
