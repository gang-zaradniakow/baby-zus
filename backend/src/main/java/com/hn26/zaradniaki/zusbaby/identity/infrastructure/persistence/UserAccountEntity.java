package com.hn26.zaradniaki.zusbaby.identity.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "user_account")
@Getter
@Setter
@NoArgsConstructor
class UserAccountEntity {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String subject;

    private String personaId;

    private String displayName;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(nullable = false, columnDefinition = "text[]")
    private String[] roles;

    @Column(nullable = false)
    private Instant createdAt;
}
