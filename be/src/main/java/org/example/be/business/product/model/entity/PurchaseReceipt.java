package org.example.be.business.product.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.be.common.util.Auditable;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "purchase_receipt")
public class PurchaseReceipt extends Auditable {

    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "import_date", nullable = false)
    private LocalDate importDate;

    @Column(name = "supplier_name")
    private String supplierName; // tên đơn vị nhập hàng
}