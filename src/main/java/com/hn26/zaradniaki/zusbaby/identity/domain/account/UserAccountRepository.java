package com.hn26.zaradniaki.zusbaby.identity.domain.account;

import java.util.Optional;
import java.util.UUID;

/** Port: user accounts. */
public interface UserAccountRepository {

    Optional<UserAccount> findById(UUID id);

    Optional<UserAccount> findBySubject(String subject);

    void save(UserAccount account);
}
