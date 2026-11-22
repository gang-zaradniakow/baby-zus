package com.hn26.zaradniaki.zusbaby.identity.domain.login;

import java.util.Optional;

/** Port: one-time login codes. */
public interface AuthorizationCodeRepository {

    void save(AuthorizationCode code);

    /** Removes the code and returns it: a code can be taken only once. */
    Optional<AuthorizationCode> take(String codeHash);
}
