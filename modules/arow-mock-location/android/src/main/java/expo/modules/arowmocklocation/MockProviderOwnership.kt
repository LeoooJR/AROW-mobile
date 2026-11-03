package expo.modules.arowmocklocation

/** Durable resource claims, never a simulation target or a restart request. */
internal class MockProviderOwnership(
  recovered: Set<String>,
  private val persist: (Set<String>) -> Unit,
) {
  var providers: Set<String> = recovered.toSet()
    private set

  fun claim(provider: String) {
    val next = providers + provider
    // Write ahead: process death after installation must not lose ownership.
    persist(next)
    providers = next
  }

  fun releaseAll(remove: (String) -> Unit): Boolean {
    for (provider in providers.toList()) {
      try {
        remove(provider)
        val remaining = providers - provider
        persist(remaining)
        providers = remaining
      } catch (exception: Exception) {
        // Keep the claim actionable even if removal succeeded but persistence failed.
      }
    }
    return providers.isEmpty()
  }
}
