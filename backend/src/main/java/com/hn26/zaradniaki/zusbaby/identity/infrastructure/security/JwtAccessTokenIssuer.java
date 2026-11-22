package com.hn26.zaradniaki.zusbaby.identity.infrastructure.security;

import com.hn26.zaradniaki.zusbaby.identity.domain.account.Role;
import com.hn26.zaradniaki.zusbaby.identity.domain.account.UserAccount;
import com.hn26.zaradniaki.zusbaby.identity.domain.token.AccessTokenIssuer;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;

/**
 * Adapter of the {@link AccessTokenIssuer} port: HS256 JWT with the user id as
 * {@code sub} and the roles in {@code roles}.
 */
@Component
@RequiredArgsConstructor
class JwtAccessTokenIssuer implements AccessTokenIssuer {

    static final String ROLES_CLAIM = "roles";

    private final JwtEncoder encoder;
    private final IdentityProperties properties;

    @Override
    public String issue(UserAccount account, Instant now) {
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer(properties.issuer()).subject(account.id().toString())
                .issuedAt(now).expiresAt(now.plus(properties.accessTokenTtl()))
                .claim(ROLES_CLAIM, account.roles().stream().map(Role::name).sorted().toList()).build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
    }
}
