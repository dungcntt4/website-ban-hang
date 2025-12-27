package org.example.be.business.order.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.example.be.business.auth.entity.User;
import org.example.be.common.util.Auditable;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Getter
@Setter
public class Order extends Auditable {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(unique = true, nullable = false)
    private String orderCode;

    @ManyToOne
    private User user;

    @Enumerated(EnumType.STRING)
    private OrderStatus status; // CHO_THANH_TOAN, DA_THANH_TOAN, DA_HUY

    private BigDecimal totalAmount;

    private String paymentMethod;

    private String receiverName;
    private String receiverPhone;
    private String shippingAddress;
    @OneToMany(
            mappedBy = "order",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private List<OrderItem> orderItems;
}

