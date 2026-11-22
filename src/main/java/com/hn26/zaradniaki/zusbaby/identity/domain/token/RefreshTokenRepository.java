package com.hn26.zaradniaki.zusbaby.identity.domain.token;

import java.util.Optional;

/** Port: refresh tokens. */
public interface RefreshTokenRepository {

    Optional<RefreshToken> findByHash(String tokenHash);

    void save(RefreshToken token);
}
