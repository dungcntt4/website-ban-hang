package org.example.be.business.order.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.example.be.business.product.model.entity.ProductVariant;
import org.example.be.common.util.Auditable;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "order_items")
@Getter
@Setter
public class OrderItem extends Auditable {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    private Order order;

    @ManyToOne
    private ProductVariant productVariant;

    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
}

