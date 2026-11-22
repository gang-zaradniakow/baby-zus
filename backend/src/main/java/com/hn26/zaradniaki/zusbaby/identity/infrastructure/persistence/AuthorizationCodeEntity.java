package com.hn26.zaradniaki.zusbaby.identity.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "authorization_code")
@Getter
@Setter
@NoArgsConstructor
class AuthorizationCodeEntity {

    @Id
    private String codeHash;

    @Column(nullable = false)
    private String subject;

    private String personaId;

    private String displayName;

    @Column(nullable = false)
    private String redirectUri;

    @Column(nullable = false)
    private Instant expiresAt;
}
