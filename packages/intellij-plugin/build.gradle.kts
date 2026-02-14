plugins {
	id("java")
	id("org.jetbrains.kotlin.jvm") version "2.1.20"
	id("org.jetbrains.intellij.platform") version "2.10.2"
}

group = "com.ripple_ts.intellij_plugin"
version = "0.0.82"

repositories {
	mavenCentral()
	intellijPlatform {
		defaultRepositories()
	}
}

// Read more: https://plugins.jetbrains.com/docs/intellij/tools-intellij-platform-gradle-plugin.html
dependencies {
	intellijPlatform {
		webstorm("2025.2.4")
		testFramework(org.jetbrains.intellij.platform.gradle.TestFrameworkType.Platform)

		// Add plugin dependencies for compilation here:
		bundledPlugin("org.jetbrains.plugins.textmate")
	}
}

intellijPlatform {
	pluginConfiguration {
		ideaVersion {
			sinceBuild = "252.25557"
		}

		changeNotes = """
	            Ripple language support for IntelliJ Platform IDEs.
	        """.trimIndent()
	}
}

tasks {
	// Set the JVM compatibility versions
	withType<JavaCompile> {
		sourceCompatibility = "21"
		targetCompatibility = "21"
	}
}

kotlin {
	compilerOptions {
		jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_21)
	}
}
