package com.hn26.zaradniaki.zusbaby.identity.application.dto;

import com.hn26.zaradniaki.zusbaby.identity.domain.account.Role;
import java.util.Set;
import java.util.UUID;

public record UserDto(UUID id, String personaId, String displayName, Set<Role> roles) {
}
