<div id="top">

<!-- HEADER STYLE: CLASSIC -->
<div align="center">

<img src="https://img.shields.io/github/predator229/cmpharma_admin/src/assets/images/logo.png" width="30%" style="position: relative; top: 0; right: 0;" alt="Project Logo"/>

# CMPHARMA_ADMIN

<em></em>

<!-- BADGES -->
<img src="https://github.com/predator229/cmpharma_admin/blob/main/src/assets/images/logo.png" alt="license">
<img src="https://img.shields.io/github/last-commit/predator229/cmpharma_admin?style=default&logo=git&logoColor=white&color=0080ff" alt="last-commit">
<img src="https://img.shields.io/github/languages/top/predator229/cmpharma_admin?style=default&color=0080ff" alt="repo-top-language">
<img src="https://img.shields.io/github/languages/count/predator229/cmpharma_admin?style=default&color=0080ff" alt="repo-language-count">

<!-- default option, no dependency badges. -->


<!-- default option, no dependency badges. -->

</div>
<br>

---

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
  - [Project Index](#project-index)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Testing](#testing)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Overview



---

## Features

| Component | Details |
| --- | --- |
| **Architecture** | <ul><li>Monolithic architecture with a N+1 pattern for database queries</li><li>Use of Angular CLI for project setup and management</li></ul> |
| **Code Quality** | <ul><li>Adheres to Prettier coding standards</li><li>Uses ESLint for code linting and formatting</li><li>Enforces TypeScript type checking</li></ul> |
| **Documentation** | <ul><li>Generated documentation using Angular CLI's built-in documentation generator</li><li>Lack of explicit documentation for certain components and features</li></ul> |
| **Integrations** | <ul><li>Integration with Firebase for real-time data storage and authentication</li><li>Use of Leaflet for mapping and geolocation functionality</li><li>Integration with Chart.js for data visualization</li></ul> |
| **Modularity** | <ul><li>Components are loosely coupled, but some dependencies are tightly coupled</li><li>Lack of explicit module boundaries and separation of concerns</li></ul> |
| **Testing** | <ul><li>Use of Jasmine for unit testing and Karma for end-to-end testing</li><li>Some tests are missing or incomplete</li></ul> |
| **Performance** | <ul><li>Optimized database queries using N+1 pattern</li><li>Lack of explicit performance optimization techniques</li></ul> |
| **Security** | <ul><li>Use of HTTPS for secure data transmission</li><li>Lack of explicit security measures, such as input validation and sanitization</li></ul> |
| **Dependencies** | <ul><li>Large number of dependencies, including some outdated or unused packages</li><li>Lack of explicit dependency management</li></ul> |
| **Scalability** | <ul><li>Monolithic architecture may become a bottleneck for large-scale applications</li><li>Lack of explicit scalability measures, such as load balancing and caching</li></ul> |

---

## Project Structure

```sh
└── cmpharma_admin/
    ├── LICENSE
    ├── README.md
    ├── angular.json
    ├── dataconnect
    │   ├── connector
    │   ├── dataconnect.yaml
    │   └── schema
    ├── dataconnect-generated
    │   └── js
    ├── eslint.config.js
    ├── firebase.json
    ├── karma.conf.js
    ├── package.json
    ├── public
    │   ├── 404.html
    │   └── index.html
    ├── replacess.js
    ├── selects2-ajax.directive.ts
    ├── src
    │   ├── .DS_Store
    │   ├── app
    │   ├── assets
    │   ├── environments
    │   ├── favicon.ico
    │   ├── index.html
    │   ├── main.ts
    │   ├── polyfills.ts
    │   ├── scss
    │   ├── styles.scss
    │   └── test.ts
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.spec.json
    ├── update-env.js
    └── yarn.lock
```

### Project Index

<details open>
	<summary><b><code>CMPHARMA_ADMIN/</code></b></summary>
	<!-- __root__ Submodule -->
	<details>
		<summary><b>__root__</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ __root__</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/LICENSE'>LICENSE</a></b></td>
					<td style='padding: 8px;'>- The LICENSE file serves as the foundation of the projects open-source architecture, outlining the terms and conditions under which users can utilize the software<br>- It provides a clear framework for collaboration and distribution, ensuring that all contributors adhere to the same standards<br>- By adopting this license, developers can build upon the existing codebase with confidence, knowing they are bound by the same rules and restrictions.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/tsconfig.app.json'>tsconfig.app.json</a></b></td>
					<td style='padding: 8px;'>- Compiles Angular application<br>- The <code>tsconfig.app.json</code> file configures the TypeScript compiler to output compiled JavaScript files in the <code>out-tsc/app</code> directory<br>- It extends the base configuration from <code>tsconfig.json</code>, specifying additional files and directories to include in the compilation process, ensuring a seamless build for the entire project.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/update-env.js'>update-env.js</a></b></td>
					<td style='padding: 8px;'>- Updates environment variables with local IP address<br>- The <code>update-env.js</code> file updates the <code>environment.ts</code> file with the current local IP address, replacing placeholders with actual values to enable API and WebSocket connections<br>- This ensures secure and efficient communication between the application and its backend services.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/angular.json'>angular.json</a></b></td>
					<td style='padding: 8px;'>- The provided Angular project configuration file orchestrates the build, serve, test, and lint processes for a web application<br>- It defines multiple configurations (production, preprod, development) to cater to different environments, ensuring efficient and optimized builds for each scenario<br>- The file integrates various dependencies and assets, setting the stage for a robust and scalable application architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/replacess.js'>replacess.js</a></b></td>
					<td style='padding: 8px;'>- Automates Sass Function Replacement**Replaces <code>darken()</code> and <code>lighten()</code> functions with <code>color.adjust</code> equivalents in SCSS files within the project directory, ensuring consistent color manipulation across the codebase<br>- The script recursively traverses directories, processing <code>.scss</code> files and updating their contents to maintain a uniform coding standard.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/selects2-ajax.directive.ts'>selects2-ajax.directive.ts</a></b></td>
					<td style='padding: 8px;'>- Enables asynchronous AJAX-powered dropdown selection** The Select2AjaxDirective enables a dynamic dropdown selection with AJAX-powered search capabilities, allowing users to filter results based on country and search term<br>- It integrates with the Angular framework, utilizing jQuery and Select2 libraries to fetch data from a specified API URL<br>- The directive emits an event when a selected value is changed, providing a seamless user experience.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/package.json'>package.json</a></b></td>
					<td style='padding: 8px;'>- The <code>cmPaharma</code> project is a comprehensive Angular application that leverages various dependencies to provide a robust and feature-rich experience<br>- It achieves this by integrating multiple libraries, including Firebase, Leaflet, and Chart.js, to deliver a dynamic user interface and seamless data visualization capabilities.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/karma.conf.js'>karma.conf.js</a></b></td>
					<td style='padding: 8px;'>- Configure Karma Test RunnerThe karma.conf.js file sets up the test runner for an Angular application, defining the testing framework, plugins, and configuration options to run tests in Chrome browser<br>- It enables Jasmine, Angular DevKit build tools, and other necessary plugins to ensure comprehensive testing coverage<br>- The configuration ensures fast and reliable testing with detailed reports and code coverage analysis.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/tsconfig.json'>tsconfig.json</a></b></td>
					<td style='padding: 8px;'>- The provided <code>tsconfig.json</code> file configures the TypeScript compiler settings for an Angular project, enabling features like source maps and module resolution<br>- It sets the target version to ES2022 and specifies the base URL as the root directory<br>- This configuration enables the compilation of the projects codebase architecture, resulting in optimized and maintainable JavaScript files.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/firebase.json'>firebase.json</a></b></td>
					<td style='padding: 8px;'>- Configure Firebase Hosting settings<br>- The firebase.json file defines the hosting configuration for a web application, specifying the public directory and files to ignore during deployment<br>- This setup enables seamless serving of static assets from Firebase Hosting, allowing developers to focus on building their applications core functionality<br>- It facilitates easy deployment and management of the projects frontend content.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/eslint.config.js'>eslint.config.js</a></b></td>
					<td style='padding: 8px;'>- Configures ESLint for Angular projects, enforcing coding standards and best practices<br>- Integrates with TypeScript and Angular-eslint to validate directive selectors, component selectors, and template structure<br>- Ensures accessibility and stylistic consistency across the project, while disabling certain rules to accommodate specific requirements<br>- Provides a unified configuration for both TypeScript and HTML files.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/tsconfig.spec.json'>tsconfig.spec.json</a></b></td>
					<td style='padding: 8px;'>- Generates Angular project configuration file<br>- Compiles test and polyfill files, including source files with <code>.spec.ts</code> and <code>.d.ts</code> extensions, into the <code>out-tsc/spec</code> directory<br>- Extends the main <code>tsconfig.json</code> file, adding types for Jasmine testing framework and specifying output directory.</td>
				</tr>
			</table>
		</blockquote>
	</details>
	<!-- dataconnect Submodule -->
	<details>
		<summary><b>dataconnect</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ dataconnect</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/dataconnect/dataconnect.yaml'>dataconnect.yaml</a></b></td>
					<td style='padding: 8px;'>- Configures Data Connect Service**The dataconnect.yaml file configures the Data Connect service, defining its architecture and settings<br>- It establishes a connection to a PostgreSQL database using Cloud SQL, specifying the instance ID and database name<br>- The schema source is set to./schema", indicating that the project's schema definitions are stored in this directory<br>- This configuration enables data integration and processing for the CM Pharma Admin service.</td>
				</tr>
			</table>
			<!-- schema Submodule -->
			<details>
				<summary><b>schema</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ dataconnect.schema</b></code>
					<table style='width: 100%; border-collapse: collapse;'>
					<thead>
						<tr style='background-color: #f8f9fa;'>
							<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
							<th style='text-align: left; padding: 8px;'>Summary</th>
						</tr>
					</thead>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/dataconnect/schema/schema.gql'>schema.gql</a></b></td>
							<td style='padding: 8px;'>- Schema Definition Achieves Comprehensive Data Modeling=====================================================The schema definition file provides a robust foundation for the entire codebase architecture, establishing relationships between key entities such as users, movies, and reviews<br>- It enables data modeling that captures complex many-to-many relationships, ensuring seamless integration of user-generated content with movie metadata<br>- The schema serves as a backbone for data storage and retrieval, facilitating efficient querying and analysis of the applications core data.</td>
						</tr>
					</table>
				</blockquote>
			</details>
			<!-- connector Submodule -->
			<details>
				<summary><b>connector</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ dataconnect.connector</b></code>
					<table style='width: 100%; border-collapse: collapse;'>
					<thead>
						<tr style='background-color: #f8f9fa;'>
							<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
							<th style='text-align: left; padding: 8px;'>Summary</th>
						</tr>
					</thead>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/dataconnect/connector/connector.yaml'>connector.yaml</a></b></td>
							<td style='padding: 8px;'>- Generates JavaScript SDK for Default Connector**The <code>connector.yaml</code> file orchestrates the generation of a JavaScript SDK for the default connector in the dataconnect project<br>- It configures the output directory, package name, and package JSON directory for the generated SDK<br>- This enables developers to easily integrate the default connector into their applications using the provided JavaScript SDK.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/dataconnect/connector/queries.gql'>queries.gql</a></b></td>
							<td style='padding: 8px;'>- Generates queries for the movie app, enabling users to list all movies, search for specific titles and genres, retrieve user reviews, and fetch movie metadata<br>- The queries are secured with authentication levels controlling access, allowing public listing of movies, admin-only listing of users, and authenticated retrieval of user reviews and movie details.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/dataconnect/connector/mutations.gql'>mutations.gql</a></b></td>
							<td style='padding: 8px;'>- Generates Mutations for Movie App**The mutations.gql file defines a set of API endpoints for interacting with the movie apps data<br>- It enables users to create movies, upsert user information, add reviews, and delete reviews<br>- These mutations are secured by authentication levels, ensuring only verified users can perform certain actions<br>- The codebase architecture relies on these mutations to manage user interactions and data updates.</td>
						</tr>
					</table>
				</blockquote>
			</details>
		</blockquote>
	</details>
	<!-- public Submodule -->
	<details>
		<summary><b>public</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ public</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/public/index.html'>index.html</a></b></td>
					<td style='padding: 8px;'>- Launches Firebase Hosting Setup Page**The public/index.html file serves as the entry point for the Firebase Hosting setup page, providing a welcome message and instructions to users after successful setup<br>- It initializes the Firebase SDK with various features, displaying a success message or error if initialization fails<br>- The page is designed to be responsive and visually appealing, making it an essential component of the overall project architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/public/404.html'>404.html</a></b></td>
					<td style='padding: 8px;'>- The <code>404.html</code> file serves as a custom error page for the project, providing a user-friendly experience when a requested resource is not found<br>- It displays a clear message and instructions on how to modify the page in the projects public directory, utilizing Firebases Command-Line Interface.</td>
				</tr>
			</table>
		</blockquote>
	</details>
	<!-- src Submodule -->
	<details>
		<summary><b>src</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ src</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/index.html'>index.html</a></b></td>
					<td style='padding: 8px;'>- Launches the applications main page, rendering the welcome screen with a title, meta tags, and a favicon<br>- It sets up the Google Maps API integration and links to external stylesheets and scripts, ensuring a seamless user experience<br>- The HTML file serves as the entry point for the ctmPharma application, providing a solid foundation for its functionality and layout.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/main.ts'>main.ts</a></b></td>
					<td style='padding: 8px;'>- Launches the Angular application, enabling production mode if applicable<br>- Initializes the browser environment with required providers and modules, ensuring a seamless user experience<br>- Sets up the HTTP client with interceptors, facilitating efficient data transfer and error handling<br>- Successfully boots the application, catching any errors that may occur during initialization.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/styles.scss'>styles.scss</a></b></td>
					<td style='padding: 8px;'>- Establishes Foundation for Global Styles**The <code>styles.scss</code> file serves as the central hub for global styles, importing and compiling various modules to create a cohesive visual identity for the application<br>- It sets up the foundation for layout, typography, and component styling, ensuring consistency across the entire codebase.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/test.ts'>test.ts</a></b></td>
					<td style='padding: 8px;'>- Overview of Test Environment Setup**The <code>test.ts</code> file sets up the Angular testing environment by initializing the testing module and loading all test files recursively<br>- It enables the testing framework to discover and load tests, ensuring a comprehensive testing suite for the project<br>- This setup is crucial for running unit tests, integration tests, and end-to-end tests, ultimately contributing to the overall quality and reliability of the application.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/polyfills.ts'>polyfills.ts</a></b></td>
					<td style='padding: 8px;'>- Enables Browser Support for Angular Application**This polyfills file is crucial for ensuring compatibility with various browsers, allowing the Angular application to function seamlessly across different environments<br>- By including essential polyfills and ZoneJS, it enables the app to run on evergreen" browsers, which automatically update themselves, covering recent versions of Safari, Chrome, Edge, and iOS/Chrome mobile devices.</td>
				</tr>
			</table>
			<!-- app Submodule -->
			<details>
				<summary><b>app</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ src.app</b></code>
					<table style='width: 100%; border-collapse: collapse;'>
					<thead>
						<tr style='background-color: #f8f9fa;'>
							<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
							<th style='text-align: left; padding: 8px;'>Summary</th>
						</tr>
					</thead>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/app.component.html'>app.component.html</a></b></td>
							<td style='padding: 8px;'>- The <code>app.component.html</code> file serves as the entry point for the applications main component, directing users to a loading spinner while the app initializes<br>- Upon successful initialization, the spinner is replaced by the actual application content<br>- This file plays a crucial role in providing a seamless user experience during the apps startup process.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/app-routing.module.ts'>app-routing.module.ts</a></b></td>
							<td style='padding: 8px;'>- Route Configuration Defines the Applications Navigation Structure.The provided routing module configuration sets up the applications navigation structure, defining routes for different areas such as admin, pharmacy, and guest sections<br>- It ensures secure access to these areas based on user roles and permissions, utilizing guards like AuthGuard and GroupGuard.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/generalmap.component.ts'>generalmap.component.ts</a></b></td>
							<td style='padding: 8px;'>- Overview of MapComponent**Maps user-provided latitude and longitude coordinates onto a Google map, displaying a marker with customizable title and zoom level<br>- The component is designed to be reusable and adaptable to various map configurations, allowing users to easily embed interactive maps into their applications<br>- It serves as a fundamental building block for geospatial visualizations within the project.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/app-config.ts'>app-config.ts</a></b></td>
							<td style='padding: 8px;'>- Configures the applications settings, defining key properties that influence its behavior<br>- The setupsConfig class controls the collapse state of the menu and sets the font family used throughout the app<br>- These settings have a significant impact on the user experience, making them a crucial component of the overall architecture<br>- They enable customization and flexibility in the applications layout and visual identity.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/app.component.scss'>app.component.scss</a></b></td>
							<td style='padding: 8px;'>- Serves as the primary stylesheet for the applications UI components<strong>, defining global styles and layout configurations<br>- </strong>Enables responsive design and visual consistency<strong> across the entire project, ensuring a cohesive user experience<br>- </strong>Works in conjunction with other CSS files to deliver a polished and modern interface**.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/app.module.ts'>app.module.ts</a></b></td>
							<td style='padding: 8px;'>- The <code>app.module.ts</code> file serves as the foundation for the entire application, integrating various modules and services to create a cohesive framework<br>- It enables authentication, routing, and theme management, setting the stage for the overall architecture of the codebase<br>- This module is crucial for the applications functionality and stability.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/app.component.ts'>app.component.ts</a></b></td>
							<td style='padding: 8px;'>- The <code>app.component.ts</code> file serves as the entry point of the application, initializing the Angular component that renders the root element of the app<br>- It sets up routing and imports necessary modules, including an authentication interceptor to manage HTTP requests<br>- This file enables the overall application architecture, allowing users to interact with the system.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/firebase.config.ts'>firebase.config.ts</a></b></td>
							<td style='padding: 8px;'>- Initialize Firebase App ArchitectureThe firebase.config.ts file serves as the foundation for the projects Firebase app architecture<br>- It sets up a connection to the Firebase Realtime Database and enables analytics tracking, providing a centralized hub for managing user data, authentication, and application metrics<br>- This configuration enables seamless integration with other services within the codebase, facilitating efficient data exchange and real-time updates.</td>
						</tr>
					</table>
					<!-- models Submodule -->
					<details>
						<summary><b>models</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ src.app.models</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/Group.class.ts'>Group.class.ts</a></b></td>
									<td style='padding: 8px;'>- Group Model Architecture**The Group model provides a structured representation of organizational entities, enabling the management of permissions and platform associations<br>- It achieves this by defining an enumeration of group codes, platform types, and interfaces for data exchange<br>- The model allows for flexible permission assignments and platform selection, facilitating a scalable and maintainable system architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/ApiUserDetails.ts'>ApiUserDetails.ts</a></b></td>
									<td style='padding: 8px;'>- Defines API User Details Interface**Establishes the structure for storing user details in the application, including error handling and optional fields such as country, city, address, and phone numbers<br>- The interface also defines relationships with other entities like Country, Group, and SetupBase, enabling data consistency and integrity across the system.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/ZoneCoordinates.class.ts'>ZoneCoordinates.class.ts</a></b></td>
									<td style='padding: 8px;'>- The ZoneCoordinates class defines a data structure for storing geographic coordinates with associated locations<br>- It provides a simple and flexible way to represent zone boundaries, enabling efficient storage and retrieval of spatial data<br>- By leveraging the Location model, this class facilitates seamless integration with other components of the projects architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/Image.class.ts'>Image.class.ts</a></b></td>
									<td style='padding: 8px;'>- The Image class defines a data structure for storing image metadata, including title, URL, description, type, and creation/update timestamps<br>- It extends the BaseDocument interface to inherit common fields like _id and createdAt<br>- This model provides a foundation for interacting with images in the application, enabling data storage and retrieval.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/OpeningHours.class.ts'>OpeningHours.class.ts</a></b></td>
									<td style='padding: 8px;'>- The <code>OpeningHoursClass</code> defines a data model for storing opening hours of a business<br>- It provides a structured way to represent daily opening and closing times, along with the day of the week<br>- The class ensures data validation and provides methods to retrieve the day name from the assigned number.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/ChatAttaschment.class.ts'>ChatAttaschment.class.ts</a></b></td>
									<td style='padding: 8px;'>- The ChatAttachment class defines the structure of a chat attachment entity, encapsulating metadata such as name, URL, type, size, and activation status<br>- It provides a constructor to initialize objects from partial data, ensuring consistency across the application<br>- This model serves as a foundation for storing and managing attachments in the projects database.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/Pharmacy.class.ts'>Pharmacy.class.ts</a></b></td>
									<td style='padding: 8px;'>- Pharmacy Class Model Definition**The Pharmacy class model defines a comprehensive data structure for representing pharmacy information, including address, working hours, location, and delivery services<br>- It provides a robust foundation for storing and managing pharmacy data, enabling efficient querying and manipulation of the data<br>- The model supports various attributes, such as rating, revenue, and documents, to provide a detailed view of each pharmacys characteristics.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/Product.ts'>Product.ts</a></b></td>
									<td style='padding: 8px;'>- Product Model Definition**The Product model defines a comprehensive data structure for representing pharmaceutical products, encompassing attributes such as name, description, categories, pricing, and promotional information<br>- It provides methods for determining product visibility, checking promotions, and cloning product instances with optional updates<br>- This model serves as the foundation for managing product data in the application.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/Country.ts'>Country.ts</a></b></td>
									<td style='padding: 8px;'>- Model Country Data Structure**The Country class provides a data structure for storing and managing country information<br>- It achieves this by defining a set of properties (id, name, emoji, code, dial_code) that can be used to represent a country in the application<br>- The class also includes static methods for parsing API responses into Country objects, enabling seamless integration with external data sources.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/Location.ts'>Location.ts</a></b></td>
									<td style='padding: 8px;'>- The Location class defines a data structure for storing geographical coordinates, providing a standardized interface for interacting with location data across the application<br>- It enables flexible data representation and validation, ensuring consistency in handling latitude and longitude values<br>- By implementing the BaseDocument interface, it integrates seamlessly into the overall document-oriented architecture of the project.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/Activity.class.ts'>Activity.class.ts</a></b></td>
									<td style='padding: 8px;'>- The ActivityLoged class serves as a data model for storing activity logs within the applications architecture<br>- It encapsulates essential attributes such as type, title, description, and timestamps, providing a structured representation of logged activities<br>- This class forms a fundamental component of the overall codebase, enabling data consistency and organization across various parts of the system.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/DeliveryZone.class.ts'>DeliveryZone.class.ts</a></b></td>
									<td style='padding: 8px;'>- The DeliveryZone class defines a data structure for representing geographic areas used in delivery calculations<br>- It encapsulates zone type, coordinates, radius, and activation status, providing a standardized format for storing and retrieving delivery zone information<br>- The class ensures data consistency by applying default values to optional fields, enabling efficient data management within the larger codebase.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/Mobil.class.ts'>Mobil.class.ts</a></b></td>
									<td style='padding: 8px;'>- The Mobil class defines a data model for storing mobile number information<br>- It provides a structured way to represent and manipulate mobile numbers, including digits, indicatif, title, creation and update timestamps<br>- This model serves as the foundation for the entire codebase, enabling data storage and retrieval of mobile numbers in a standardized format.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/Deliver.class.ts'>Deliver.class.ts</a></b></td>
									<td style='padding: 8px;'>- Deliver Model Defines Data Structure for Vehicle Deliveries**The <code>Deliver</code> class defines a data structure for vehicle deliveries, encapsulating various attributes such as user information, vehicle details, and operational data<br>- It provides a robust foundation for storing and managing delivery records, enabling efficient data retrieval and manipulation<br>- The model supports partial data input, allowing for flexible data validation and population.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/WorkingHours.ts'>WorkingHours.ts</a></b></td>
									<td style='padding: 8px;'>- Establishes a data model for working hours, defining the structure of documents that store daily schedules<br>- Provides a foundation for managing and storing opening hours data, enabling the creation of flexible and dynamic records<br>- Facilitates data exchange between different components of the application, ensuring consistency and accuracy in scheduling information.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/Category.class.ts'>Category.class.ts</a></b></td>
									<td style='padding: 8px;'>- The Category class has several useful methods for managing its properties and behavior<br>- The <code>isActive()</code> method checks if the category is active, while <code>isRootCategory()</code> determines if its a root category with no parent<br>- The <code>getFullPath()</code> method returns the full path of the category, and <code>getBreadcrumb()</code> returns an array of slugs representing the category hierarchy<br>- Additionally, methods like <code>incrementViewCount()</code>, <code>updateProductCount()</code>, and <code>toJson()</code> provide convenient ways to update and serialize the category data.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/Uid.class.ts'>Uid.class.ts</a></b></td>
									<td style='padding: 8px;'>- Generates Unique Identifiers for Documents**The <code>Uid</code> class generates unique identifiers for documents, serving as a core component of the projects data storage architecture<br>- It provides a standardized way to create and manage user IDs, ensuring consistency across the application<br>- By utilizing this class, developers can easily incorporate unique identifiers into their documents, enabling efficient data retrieval and manipulation.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/Order.ts'>Order.class.ts</a></b></td>
									<td style='padding: 8px;'>- The Order class defines the structure of an order document, encapsulating essential information such as total amount, status, and delivery details<br>- It establishes a foundation for data storage and retrieval in the applications database<br>- By providing a standardized model, this class enables efficient data management and facilitates seamless interactions between different components of the system.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/Custumer.class.ts'>Custumer.class.ts</a></b></td>
									<td style='padding: 8px;'>- The Customer class defines the structure of customer data, encapsulating various attributes such as contact information, medical conditions, and emergency contacts<br>- It serves as a base document for storing and retrieving customer data in the applications database<br>- The model provides a flexible framework for managing customer information, enabling efficient data storage and retrieval.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/File.class.ts'>File.class.ts</a></b></td>
									<td style='padding: 8px;'>- The <code>File.class.ts</code> file defines a data model for storing file metadata, including properties such as original name, file type, size, and upload details<br>- It provides a structured way to represent files in the application, enabling efficient storage and retrieval of file information<br>- This model serves as a foundation for file management and related functionality within the codebase.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/Permission.class.ts'>Permission.class.ts</a></b></td>
									<td style='padding: 8px;'>- The Permission class enables the creation, management, and validation of permissions within a system<br>- It provides methods to add, remove, and check permissions, ensuring data integrity and consistency<br>- The class also supports serialization and deserialization of permission data, facilitating efficient storage and retrieval<br>- This component is crucial for implementing access control mechanisms in the overall system architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/BaseDocument.ts'>BaseDocument.ts</a></b></td>
									<td style='padding: 8px;'>- Document Model DefinitionThe <code>BaseDocument</code> interface defines the core structure of a document model, serving as a foundation for other models within the application<br>- It establishes a common set of properties, including <code>_id</code>, <code>createdAt</code>, and <code>updatedAt</code>, which are used to track document metadata and version history<br>- This definition enables data consistency across the system, facilitating efficient data management and retrieval.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/MiniChatMessage.class.ts'>MiniChatMessage.class.ts</a></b></td>
									<td style='padding: 8px;'>- The MiniChatMessage class defines a data structure for storing chat messages within the application<br>- It encompasses various attributes such as sender information, message content, and attachment details<br>- This model serves as a foundation for managing and displaying chat conversations in the system.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/SetupBase.ts'>SetupBase.ts</a></b></td>
									<td style='padding: 8px;'>- Defines Core Data Structure**The SetupBase interface establishes a fundamental data model for the application, outlining essential properties such as font family, size, theme, and menu collapse status<br>- It serves as a foundation for storing and managing setup configurations across the project, enabling consistent data representation throughout the codebase.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/UserDatails.ts'>UserDatails.ts</a></b></td>
									<td style='padding: 8px;'>- The UserDetails class is a crucial component of the applications architecture, responsible for managing user data and permissions<br>- It provides methods to load all permissions, check if a user has specific permissions, and calculate permission stats<br>- This class plays a vital role in ensuring secure access control and navigation within the application.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/UserDetailsApiResponse.ts'>UserDetailsApiResponse.ts</a></b></td>
									<td style='padding: 8px;'>- Defines User Details API Response Structure**Establishes a standardized data format for user details responses across the application<br>- The UserDetailsApiResponse interface defines a set of properties, including name, address, phone number, and optional profile picture information<br>- This structure enables consistent data exchange between different components of the system, ensuring seamless integration and reducing errors.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/models/Country.class.ts'>Country.class.ts</a></b></td>
									<td style='padding: 8px;'>- The Country class defines a data model for storing country information, including name, emoji, code, dial code, and full name<br>- It implements the BaseDocument interface to provide a standardized structure for documents in the application<br>- This model enables data storage and retrieval of country details, serving as a foundation for the projects data management system.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- controllers Submodule -->
					<details>
						<summary><b>controllers</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ src.app.controllers</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/controllers/comonsfunctions.ts'>comonsfunctions.ts</a></b></td>
									<td style='padding: 8px;'>- Common Functions Library**The CommonFunctions library provides a set of reusable functions for the application, including role-based redirects, data mapping, email validation, date formatting, and unique ID generation<br>- It facilitates efficient data processing and manipulation, enabling streamlined development and maintenance of the projects core functionality<br>- The library serves as a foundation for the application's logic, ensuring consistency and reliability across various components.</td>
								</tr>
							</table>
							<!-- interceptors Submodule -->
							<details>
								<summary><b>interceptors</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.controllers.interceptors</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/controllers/interceptors/auth.interceptor.ts'>auth.interceptor.ts</a></b></td>
											<td style='padding: 8px;'>- Authenticates HTTP requests with a token-based authentication mechanism**The AuthInterceptor class authenticates incoming HTTP requests by checking if a valid token is present and adding it to the request headers if so, ensuring secure communication between the client and server<br>- It integrates with the AuthService to retrieve the real token, allowing for seamless authentication across the application.</td>
										</tr>
									</table>
								</blockquote>
							</details>
							<!-- services Submodule -->
							<details>
								<summary><b>services</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.controllers.services</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/controllers/services/api.service.ts'>api.service.ts</a></b></td>
											<td style='padding: 8px;'>- Provides a centralized API service layer, enabling seamless communication between Angular components and external APIs<br>- Enables flexible and secure data exchange by providing a unified interface for GET, POST, PUT, DELETE, and full URL requests with optional headers<br>- Facilitates API interactions by abstracting underlying HTTP client functionality, promoting code organization and maintainability within the application.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/controllers/services/auth.service.ts'>auth.service.ts</a></b></td>
											<td style='padding: 8px;'>- Authenticates users and manages their session across the application<br>- The AuthService handles user login, logout, password reset, and profile editing, utilizing Firebase Authentication and API services to interact with the backend<br>- It ensures secure storage of user data and provides a unified interface for authentication-related operations.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/controllers/services/minichat.service.ts'>minichat.service.ts</a></b></td>
											<td style='padding: 8px;'>String): boolean { if (!this.socket?.connected) { console.error(Socket not connected); this.errorSubject.next(Connexion au chat perdue); return false; } if (!pharmacyId) { console.error(Pharmacy ID missing); this.errorSubject.next(ID de pharmacie manquant); return false; } const payload = { pharmacyId: pharmacyId, }; try { this.socket.emit(je_rejoins_la_phamacie_conv, payload); return true; } catch (error) { console.error(error); this.errorSubject.next(<code>Erreur de connexion: ${error.message}</code>); return false; }}```</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/controllers/services/loading.service.ts'>loading.service.ts</a></b></td>
											<td style='padding: 8px;'>- Overview of Loading Service**The LoadingService enables centralized management of loading states across the application<br>- It provides a single source of truth for loading status updates, allowing components to subscribe and react to changes in real-time<br>- By decoupling loading state from individual components, this service promotes a more modular and maintainable architecture, enhancing overall project scalability and reusability.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/controllers/services/frenchcity.service.ts'>frenchcity.service.ts</a></b></td>
											<td style='padding: 8px;'>- The <code>FrenchCitiesService</code> class retrieves data on French cities from the Geo API Gouv Fr, providing a simple interface to search and filter city information by name or population<br>- It achieves this by making HTTP requests to the API endpoint, returning relevant data in an observable format for use in the application.</td>
										</tr>
									</table>
								</blockquote>
							</details>
							<!-- guards Submodule -->
							<details>
								<summary><b>guards</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.controllers.guards</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/controllers/guards/group.guard.ts'>group.guard.ts</a></b></td>
											<td style='padding: 8px;'>- Enforces Role-Based Access Control**The <code>GroupGuard</code> class enforces role-based access control by checking if a user has the required roles to access a route<br>- It uses the <code>AuthService</code> to retrieve user details and checks if the users groups match the expected roles for the current route<br>- If the user is authenticated, it allows access; otherwise, it logs them out and redirects to the login page.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/controllers/guards/login.guard.ts'>login.guard.ts</a></b></td>
											<td style='padding: 8px;'>- Redirects users to their designated dashboard based on their role within the system<br>- The LoginGuard class uses user details and group codes to determine the redirect URL, ensuring a secure and personalized experience for each user<br>- It also handles cases where no matching role is found, defaulting to a generic dashboard<br>- This implementation enhances the overall security and usability of the application.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/controllers/guards/auth.guard.ts'>auth.guard.ts</a></b></td>
											<td style='padding: 8px;'>- Protects user access to the application by enforcing authentication checks at every route change<br>- The AuthGuard ensures that only authorized users can proceed to protected routes, redirecting them to the login page if necessary<br>- It leverages the AuthService to retrieve user details and makes decisions based on their availability, providing a seamless authentication experience for the end-users.</td>
										</tr>
									</table>
								</blockquote>
							</details>
						</blockquote>
					</details>
					<!-- views Submodule -->
					<details>
						<summary><b>views</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ src.app.views</b></code>
							<!-- authentifiedusers Submodule -->
							<details>
								<summary><b>authentifiedusers</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.views.authentifiedusers</b></code>
									<!-- pharmacy Submodule -->
									<details>
										<summary><b>pharmacy</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ src.app.views.authentifiedusers.pharmacy</b></code>
											<!-- dashboard Submodule -->
											<details>
												<summary><b>dashboard</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.authentifiedusers.pharmacy.dashboard</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/dashboard/dashboard.component.html'>dashboard.component.html</a></b></td>
															<td style='padding: 8px;'>The dashboard component displays key financial metrics, including total earnings, income, and popular stocks, providing a comprehensive view of the users pharmacy dashboard.**PurposeThis code achieves a visually appealing and informative layout, showcasing essential data points in an easily digestible format.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/dashboard/dashboard.component.scss'>dashboard.component.scss</a></b></td>
															<td style='padding: 8px;'>- Enhances Visual Appeal of Pharmacy Dashboard**The provided CSS file enhances the visual appeal of the pharmacy dashboard by modifying styles and layouts to create a cohesive user experience<br>- It optimizes navigation tabs, removes unwanted box shadows, and customizes card backgrounds to improve overall aesthetics<br>- By applying these changes, the codebase achieves a more polished and engaging interface for authenticated users.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/dashboard/dashboard.component.ts'>dashboard.component.ts</a></b></td>
															<td style='padding: 8px;'>- The dashboard component displays a pharmacy overview with charts and user details<br>- It fetches data from the <code>authUser</code> service and uses it to render a list of pharmacies, their profits, and investment amounts<br>- The component also includes a profile card with net profit and total revenue values.</td>
														</tr>
													</table>
												</blockquote>
											</details>
											<!-- settings Submodule -->
											<details>
												<summary><b>settings</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.authentifiedusers.pharmacy.settings</b></code>
													<!-- logs Submodule -->
													<details>
														<summary><b>logs</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.authentifiedusers.pharmacy.settings.logs</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/settings/logs/logs.component.ts'>logs.component.ts</a></b></td>
																	<td style='padding: 8px;'>- Generates Pharmacy Activity Logs Component**The <code>PharmacyLogsComponent</code> generates a log of pharmacy activities, displaying user information and activity types such as orders, payments, and deliveries<br>- It fetches data from the API using authentication tokens and displays errors with customizable error messages<br>- The component also handles pagination and loading states.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/settings/logs/logs.component.html'>logs.component.html</a></b></td>
																	<td style='padding: 8px;'>- Generates Pharmacy Activity Timeline**The logs.component.html file enables the generation of a pharmacy activity timeline, displaying user information and activity data within a specified period<br>- The component allows users to input a date range, triggering the loading of relevant activities<br>- The resulting timeline provides an overview of pharmacy activities, facilitating insights into user behavior and performance metrics.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/settings/logs/logs.component.scss'>logs.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Stylesheet Overview**Defines a set of reusable CSS variables and styles for the pharmacy settings logs component, providing a consistent visual identity across the application<br>- The stylesheet includes typography, colors, spacing, and layout elements, ultimately enhancing the user experience and brand cohesion<br>- It serves as a foundation for styling the components UI components, such as cards, tables, and icons.</td>
																</tr>
															</table>
														</blockquote>
													</details>
												</blockquote>
											</details>
											<!-- products Submodule -->
											<details>
												<summary><b>products</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.authentifiedusers.pharmacy.products</b></code>
													<!-- product Submodule -->
													<details>
														<summary><b>product</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.authentifiedusers.pharmacy.products.product</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/products/product/product.component.html'>product.component.html</a></b></td>
																	<td style='padding: 8px;'>Displays product images (with fallbacks for non-existent images)<em> Shows product name and short description</em> Highlights product status with corresponding badgesBy leveraging this component, the project delivers a user-friendly interface that facilitates product exploration and discovery.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/products/product/product.component.scss'>product.component.scss</a></b></td>
																	<td style='padding: 8px;'>Provides a visually appealing layout for product details<em> Includes essential product metadata (title, image, and other relevant information)</em> Utilizes responsive design principles to ensure optimal viewing experiences across various devices<strong>Integration with Project Architecture:</strong>-----------------------------------------This component is part of the larger project structure, which includes:<em> A modular front-end architecture</em> A robust authentication system for authorized user access* A comprehensive product management system for storing and retrieving product dataBy integrating this component into the overall project framework, developers can leverage a cohesive and scalable solution for displaying product information to authenticated users.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/products/product/product.component.ts'>product.component.ts</a></b></td>
																	<td style='padding: 8px;'>- Retrieves product data from the API service<em> Displays product details on the screen</em> Enables user interactions (e.g., editing or deleting products)<em> Utilizes authentication services to ensure only authorized users can access product management features<strong>Integration with Project Architecture:</strong>This component is part of a larger application that utilizes Angular and various third-party libraries<br>- It integrates seamlessly with other components, services, and modules, such as the <code>SharedModule</code>, <code>AuthService</code>, and <code>ApiService</code><br>- The component's functionality is also influenced by the project's overall architecture, which includes features like authentication, routing, and data loading.<strong>Contextual Dependencies:</strong></em> Authentication services (e.g., <code>AuthService</code>) for user authorization<em> API services (e.g., <code>ApiService</code>) for product data retrieval</em> Routing and navigation components (e.g., <code>Router</code>, <code>ActivatedRoute</code>)* UI libraries (e.g., <code>NgbModal</code>) for modal windows and other interactive elementsBy understanding the purpose and functionality of this component, developers can better navigate the projects architecture and make informed decisions about its integration with other components and services.</td>
																</tr>
															</table>
														</blockquote>
													</details>
													<!-- list Submodule -->
													<details>
														<summary><b>list</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.authentifiedusers.pharmacy.products.list</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/products/list/products.component.scss'>products.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Establishes a consistent design language across the application through the use of predefined color palettes, typography, and layout components.<em> Provides a foundation for building responsive and accessible UI elements, ensuring that the product list page is visually appealing and usable on various devices.</em> Enables easy maintenance and updates to the application's styling by encapsulating common design elements in a single file.<strong>Contextual Relevance</strong>This code file is part of a larger project structure that includes multiple components, each with its own specific functionality<br>- The <code>products.component.scss</code> file works in conjunction with other files and components to create a cohesive user experience<br>- By leveraging this set of reusable CSS variables, developers can focus on building the application's core features while maintaining consistency throughout the UI.<strong>Overall Impact</strong>The code file provides a solid foundation for the applications visual identity and layout, enabling developers to build upon it to create a polished and engaging user interface.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/products/list/products.component.ts'>products.component.ts</a></b></td>
																	<td style='padding: 8px;'>- Summary<strong>The <code>products.component.ts</code> file is a critical component of the application's authentication workflow, specifically designed to display a list of products for authenticated users<br>- This component leverages various Angular services and libraries to fetch data from the API, handle form validation, and provide a seamless user experience.</strong>Key Achievements<strong><em> Displays a list of products for authenticated users</em> Utilizes API services to fetch product data<em> Handles form validation and submission</em> Integrates with other components and services to ensure a cohesive authentication workflow</strong>Contextual Relevance**This component is part of a larger application that provides an e-commerce platform for pharmacies<br>- The <code>products.component.ts</code> file plays a crucial role in enabling authenticated users to browse and interact with product listings, ultimately driving sales and revenue for the pharmacy.By understanding the purpose and functionality of this component, developers can better appreciate the overall architecture and design decisions made within the application.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/products/list/products.component.html'>products.component.html</a></b></td>
																	<td style='padding: 8px;'>Search functionality for filtering products<em> Permission-based access control for adding and exporting products</em> User-friendly interface for managing product listsBy integrating this component into the larger codebase, developers can create a robust and feature-rich pharmacy management system that meets the needs of authorized users.</td>
																</tr>
															</table>
														</blockquote>
													</details>
												</blockquote>
											</details>
											<!-- pharmacies Submodule -->
											<details>
												<summary><b>pharmacies</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.authentifiedusers.pharmacy.pharmacies</b></code>
													<!-- details Submodule -->
													<details>
														<summary><b>details</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.authentifiedusers.pharmacy.pharmacies.details</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/pharmacies/details/details.component.ts'>details.component.ts</a></b></td>
																	<td style='padding: 8px;'>- Retrieves and displays pharmacy details from a backend API<em> Utilizes Angular forms to manage user input and validation</em> Incorporates charting capabilities using Chart.js for visualizing data<em> Leverages various services, including authentication, HTTP client, and loading management<strong>Contextual Relationships</strong>Within the project structure, this component is part of the <code>authentifiedusers</code> module, which is nested under the main application directory<br>- It relies on several external dependencies, including Angular modules (<code>CommonModule</code>, <code>SharedModule</code>), services (<code>AuthService</code>, <code>ApiService</code>, <code>LoadingService</code>), and third-party libraries (Chart.js, SweetAlert2).<strong>Key Functionality</strong>The component's primary function is to provide a user-friendly interface for viewing pharmacy details<br>- It achieves this by:</em> Fetching data from the backend API using the <code>ApiService</code><em> Validating user input using Angular forms</em> Rendering chart-based visualizations of the retrieved dataBy integrating these features, the <code>details.component.ts</code> file plays a vital role in delivering a comprehensive and interactive experience for authenticated users.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/pharmacies/details/_details.component.scss'>_details.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Overview of <code>_details.component.scss</code><strong>This CSS file is a crucial component of the project's front-end architecture, responsible for styling the details page of authenticated users' pharmacies<br>- The code defines a set of reusable variables that govern the application's color scheme, typography, and layout.By utilizing these variables, developers can maintain consistency across the entire application, ensuring a cohesive user experience<br>- The <code>_details.component.scss</code> file plays a vital role in shaping the visual identity of the project, particularly in the pharmacy details page.</strong>Key Achievements<em>*</em> Establishes a consistent color scheme and typography throughout the application<em> Provides a foundation for responsive design and layout management</em> Enables easy maintenance and updates to the application's visual elementsBy incorporating this CSS file into the projects architecture, developers can ensure that the pharmacy details page presents a professional and engaging user interface.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/pharmacies/details/_details.component.html'>_details.component.html</a></b></td>
																	<td style='padding: 8px;'>Displays pharmacy details<em> Fetches data from an API endpoint</em> Renders loading spinner during data retrieval* Includes navigation links for returning to the list of pharmaciesThis code file is a crucial component in the overall architecture of the application, providing users with essential information about specific pharmacies.</td>
																</tr>
															</table>
														</blockquote>
													</details>
													<!-- list Submodule -->
													<details>
														<summary><b>list</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.authentifiedusers.pharmacy.pharmacies.list</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/pharmacies/list/list.component.html'>list.component.html</a></b></td>
																	<td style='padding: 8px;'>Search for specific pharmacies using a text input field<em> Filter pharmacies by region using a dropdown menu</em> Add new pharmacies through an external modal window* Export the current list of pharmacies in a downloadable formatThis code file is part of a larger application that provides a comprehensive pharmacy management system, allowing users to manage their pharmacies efficiently.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/pharmacies/list/list.component.scss'>list.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Overview of the Codebase<strong>The provided code file, <code>list.component.scss</code>, is a crucial component of the larger codebase, responsible for styling and layout of the pharmacy list page<br>- This file defines a set of reusable color variables that serve as the foundation for the entire application's visual identity.By utilizing these carefully crafted color palettes, the codebase achieves a cohesive and professional appearance across all views, enhancing user experience and brand recognition<br>- The <code>list.component.scss</code> file plays a vital role in maintaining consistency throughout the application, making it an essential part of the overall architecture.</strong>Key Achievements<em>*</em> Establishes a consistent visual identity for the application<em> Provides a solid foundation for future styling and layout modifications</em> Enhances user experience through a cohesive and professional appearanceBy leveraging this code file, developers can focus on building robust functionality while maintaining a polished and visually appealing interface.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/pharmacies/list/list.component.ts'>list.component.ts</a></b></td>
																	<td style='padding: 8px;'>Displays a list of authenticated users who are pharmacists<em> Retrieves and displays relevant pharmacy-related data</em> Ensures secure authentication and authorization checks for authorized accessBy using this component, the projects architecture provides an efficient and user-friendly interface for managing pharmacy-related data and ensuring compliance with security protocols.</td>
																</tr>
															</table>
														</blockquote>
													</details>
												</blockquote>
											</details>
											<!-- categories Submodule -->
											<details>
												<summary><b>categories</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.authentifiedusers.pharmacy.categories</b></code>
													<!-- category Submodule -->
													<details>
														<summary><b>category</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.authentifiedusers.pharmacy.categories.category</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/categories/category/category.component.html'>category.component.html</a></b></td>
																	<td style='padding: 8px;'>- Summary**The <code>category.component.html</code> file is a crucial component in the pharmacy categories management system, responsible for rendering the detailed information of a specific category<br>- This component serves as a key entry point for authenticated users to view and interact with their assigned categories.Upon loading, the component displays a loading indicator to signal progress<br>- If an error occurs during data retrieval, it will display an error message<br>- Once the data is successfully loaded, it renders the category's header, including an icon, title, and navigation buttons for back and forth movement.This component plays a vital role in providing users with a seamless experience when managing their pharmacy categories, allowing them to view, edit, and delete categories as needed.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/categories/category/category.component.ts'>category.component.ts</a></b></td>
																	<td style='padding: 8px;'>Retrieves category data from the API service<em> Displays category details, including restrictions and values</em> Allows users to navigate to related pages (e.g., category edit or delete)* Utilizes authentication services to ensure only authorized users can access this pageBy integrating with other components and services, this component plays a vital role in providing a seamless user experience for authenticated users within the pharmacy categories management system.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/categories/category/category.component.scss'>category.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Generates Styled Component for Pharmacy Categories**This component generates a styled layout for pharmacy categories, providing a visually appealing and consistent user experience across the application<br>- It leverages SCSS to define custom styles, ensuring brand consistency and responsiveness<br>- The component is integral to the overall architecture of the project, enabling seamless navigation through the pharmacy category hierarchy.</td>
																</tr>
															</table>
														</blockquote>
													</details>
													<!-- list Submodule -->
													<details>
														<summary><b>list</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.authentifiedusers.pharmacy.categories.list</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/categories/list/list.component.html'>list.component.html</a></b></td>
																	<td style='padding: 8px;'>Displays a searchable list of categories with filtering capabilities<em> Allows authenticated users to add new categories (if permitted)</em> Enables exporting of the category list (if permitted)The <code>list.component.html</code> file is an essential part of the overall architecture, providing a user-friendly interface for managing pharmacy categories.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/categories/list/list.component.scss'>list.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Summary<strong>This code file, <code>list.component.scss</code>, is a crucial component of the entire codebase architecture<br>- It defines a set of reusable CSS variables that style the visual elements of the application's pharmacy categories list view.By utilizing these pre-defined color palettes and typography settings, developers can maintain consistency across the project, ensuring a cohesive user experience<br>- The file achieves this by providing a centralized location for defining and reusing design-related values, making it easier to update or modify the application's visual identity as needed.</strong>Key Benefits<em>*</em> Consistent branding throughout the application<em> Easy maintenance and updates of design elements</em> Improved collaboration among developersThis code file plays a vital role in shaping the overall look and feel of the project, enabling efficient development and ensuring a polished user interface.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/pharmacy/categories/list/list.component.ts'>list.component.ts</a></b></td>
																	<td style='padding: 8px;'>Retrieves category data from the API and displays it in a user-friendly format<em> Filters categories based on user permissions using the <code>PHARMACY_RESTRICTIONS</code> constants</em> Provides an interactive experience through features like loading animations and error handlingBy integrating with other components and services, this component plays a vital role in delivering a seamless user experience for pharmacy users.</td>
																</tr>
															</table>
														</blockquote>
													</details>
												</blockquote>
											</details>
										</blockquote>
									</details>
									<!-- admin Submodule -->
									<details>
										<summary><b>admin</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ src.app.views.authentifiedusers.admin</b></code>
											<!-- settings Submodule -->
											<details>
												<summary><b>settings</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.authentifiedusers.admin.settings</b></code>
													<!-- administrators Submodule -->
													<details>
														<summary><b>administrators</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.authentifiedusers.admin.settings.administrators</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/admin/settings/administrators/administrator.component.ts'>administrator.component.ts</a></b></td>
																	<td style='padding: 8px;'>Implementing lazy loading for large modules<em> Using a more robust error handling mechanism</em> Adding input validation and sanitization* Utilizing a more efficient data storage solutionOverall, the application demonstrates good coding habits and is ready for further development and refinement.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/admin/settings/administrators/administrator.component.html'>administrator.component.html</a></b></td>
																	<td style='padding: 8px;'>Displays a list of authenticated users<em> Allows administrators to filter users by searching for specific usernames or keywords</em> Provides buttons for opening a modal to create new users and exporting the current list of usersBy understanding this components purpose, developers can better navigate the project's architecture and make informed decisions about how to extend or modify its functionality.</td>
																</tr>
															</table>
														</blockquote>
													</details>
												</blockquote>
											</details>
											<!-- tableaubord Submodule -->
											<details>
												<summary><b>tableaubord</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.authentifiedusers.admin.tableaubord</b></code>
													<!-- recentActivities Submodule -->
													<details>
														<summary><b>recentActivities</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.authentifiedusers.admin.tableaubord.recentActivities</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/admin/tableaubord/recentActivities/recentactivities.component.ts'>recentactivities.component.ts</a></b></td>
																	<td style='padding: 8px;'>- The <code>recentactivities.component.ts</code> file is responsible for loading and displaying recent activities for authenticated users on the admin dashboard<br>- It fetches data from the API service, handles errors, and updates the UI with the received information<br>- The component utilizes various services to manage authentication, loading, and API interactions, ensuring a seamless user experience.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/admin/tableaubord/recentActivities/recentactivities.component.html'>recentactivities.component.html</a></b></td>
																	<td style='padding: 8px;'>- The <code>recentactivities.component.html</code> file serves as a dashboard component, displaying recent activities for authenticated users<br>- It features a date range input field to filter activities and an activity timeline visualization<br>- This component is part of the larger projects admin panel, providing insights into user behavior and pharmacy activities.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/admin/tableaubord/recentActivities/recentactivities.component.scss'>recentactivities.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Stylesheet Overview**Defines a set of reusable styles for the recent activities table component, including typography, colors, and layout<br>- Establishes a consistent visual identity for the dashboard, with a focus on simplicity and readability<br>- Provides a foundation for styling various elements, such as cards, badges, and buttons, to create a cohesive user experience.</td>
																</tr>
															</table>
														</blockquote>
													</details>
													<!-- dashboard Submodule -->
													<details>
														<summary><b>dashboard</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.authentifiedusers.admin.tableaubord.dashboard</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/admin/tableaubord/dashboard/dashboard.component.html'>dashboard.component.html</a></b></td>
																	<td style='padding: 8px;'>Html<ng-template #chart> <canvas id=pharmaciesRegionChart height=250></canvas></ng-template><div class=row mt-4> <div class=col-md-8> <div class=card> <div class=card-header d-flex justify-content-between align-items-center> <h5>Activité récente</h5> <a href=# class=btn btn-sm btn-outline-primary>Voir tout</a> </div> <div class=card-body p-0> <div class=activity-list> <div class=activity-item <em>ngFor=let activity of recentActivities> <div class=activity-icon [ngClass]=activity.type> <i [class]=getActivityIcon(activity.type)></i> </div> <div class=activity-content> <div class=activity-title>{{activity.title}}</div> <div class=activity-subtitle>{{activity.description}}</div> <div class=activity-time>{{activity.time | date:dd/MM/yyyy HH:mm}}</div> </div> </div> </div> </div> </div> </div></div>``<code>I made the following changes:</em> Removed unnecessary HTML elements and condensed the code.<em> Replaced the </code>ng-template<code> with a simple </code><canvas><code> element for the chart.</em> Moved the </code>activity-list` to the card body, as it was not necessary to have it outside of the card.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/admin/tableaubord/dashboard/dashboard.component.scss'>dashboard.component.scss</a></b></td>
																	<td style='padding: 8px;'>Summary<strong>Update pharmacy details page layout.</strong>Changes<em>*</em> Update logo section to display pharmacy logo with flexible width and height.<em> Add opening hours section with day-hours grid layout.</em> Introduce document grid layout for displaying pharmacy documents.<em> Enhance map placeholder with responsive image.</em> Refine typography and spacing throughout the page.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/admin/tableaubord/dashboard/dashboard.component.ts'>dashboard.component.ts</a></b></td>
																	<td style='padding: 8px;'>- The provided code appears to be a part of a larger Angular application, specifically a dashboard component that displays various charts and graphs<br>- The <code>initCharts</code> method initializes the charts using the Chart.js library, but it does not update the charts when new data is available<br>- To improve this, you can create an <code>updateCharts</code> method that retrieves the latest data from your API or database and updates the chart accordingly<br>- Additionally, consider adding error handling to ensure the application remains stable in case of data retrieval issues.</td>
																</tr>
															</table>
														</blockquote>
													</details>
													<!-- statistiques Submodule -->
													<details>
														<summary><b>statistiques</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.authentifiedusers.admin.tableaubord.statistiques</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/admin/tableaubord/statistiques/statistique.component.ts'>statistique.component.ts</a></b></td>
																	<td style='padding: 8px;'>- Summary**The <code>statistique.component.ts</code> file is a key component in the project's authentication and administration dashboard<br>- It serves as a statistics page for authenticated users, providing insights into various metrics.This component utilizes Angular's built-in services, such as <code>AuthService</code>, <code>LoadingService</code>, and <code>ApiService</code>, to fetch data from the backend API<br>- The data is then visualized using Chart.js, allowing users to view statistical trends and patterns.The components primary function is to display meaningful statistics to authenticated users, enabling them to make informed decisions based on the data presented<br>- This page is an essential part of the project's overall architecture, providing a valuable tool for administrators to monitor user activity and performance metrics.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/admin/tableaubord/statistiques/statistique.component.scss'>statistique.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Generate Statistics Overview**The <code>statistique.component.scss</code> file defines a set of reusable CSS variables and styles for displaying statistics on an administrative dashboard<br>- It achieves a visually appealing design with various card layouts, icons, and typography, making it easy to display key performance indicators and metrics in a clear and concise manner.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/admin/tableaubord/statistiques/statistique.component.html'>statistique.component.html</a></b></td>
																	<td style='padding: 8px;'>- The <code>statistique.component.html</code> file generates a comprehensive dashboard displaying key performance indicators (KPIs), sales statistics, and product trends for an administrative user interface<br>- It provides real-time data visualization through charts and tables, enabling informed decision-making.</td>
																</tr>
															</table>
														</blockquote>
													</details>
												</blockquote>
											</details>
											<!-- pharmacies Submodule -->
											<details>
												<summary><b>pharmacies</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.authentifiedusers.admin.pharmacies</b></code>
													<!-- details Submodule -->
													<details>
														<summary><b>details</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.authentifiedusers.admin.pharmacies.details</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/admin/pharmacies/details/details.component.ts'>details.component.ts</a></b></td>
																	<td style='padding: 8px;'>- Summary<strong>The <code>details.component.ts</code> file is a crucial component in the pharmacy management system, responsible for displaying detailed information about authenticated users who are pharmacists<br>- This component is part of a larger Angular application that provides a user interface for managing pharmacies and their associated data.When used in conjunction with other components, this module enables administrators to view key details about authorized pharmacists, including their profile information and any relevant activities or history<br>- The component leverages various services, such as authentication, API connectivity, and form management, to fetch and display the necessary data.</strong>Key Functionality<em>*</em> Displays detailed information about authenticated pharmacist users<em> Utilizes various services for data fetching and form management</em> Integrates with other components to provide a comprehensive user interfaceBy using this component, administrators can efficiently manage pharmacy-related data and make informed decisions.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/admin/pharmacies/details/details.component.scss'>details.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Summary<strong>This CSS file, <code>details.component.scss</code>, is a crucial component of the project's front-end architecture, responsible for styling the details page of authenticated users' pharmacies<br>- The code defines a set of reusable color variables and layout classes that enable consistent branding and visual hierarchy across the application.By leveraging these pre-defined styles, developers can focus on building functionality rather than reinventing the wheel, ensuring a cohesive user experience throughout the platform<br>- This file serves as a foundation for the project's UI components, enabling efficient maintenance and updates to the overall design language.</strong>Key Achievements<em>*</em> Establishes a consistent visual identity across the application<em> Provides a solid foundation for building reusable UI components</em> Enables developers to focus on functionality rather than stylingOverall, this CSS file plays a vital role in shaping the projects user interface and experience, making it an essential component of the entire codebase architecture.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/admin/pharmacies/details/details.component.html'>details.component.html</a></b></td>
																	<td style='padding: 8px;'>Displays the pharmacy's name and status<em> Allows administrators to activate or suspend the pharmacy with a single click</em> Provides a link to return to the list of pharmaciesThis component plays a vital role in the overall architecture of the system, enabling efficient management and tracking of pharmacy information.</td>
																</tr>
															</table>
														</blockquote>
													</details>
													<!-- list Submodule -->
													<details>
														<summary><b>list</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.authentifiedusers.admin.pharmacies.list</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/admin/pharmacies/list/list.component.html'>list.component.html</a></b></td>
																	<td style='padding: 8px;'>- Displays a search bar to filter pharmacies by name or region<em> Allows users to add new pharmacies through an open modal window</em> Provides an export feature to download the list of pharmacies in a CSV format<strong>Contextual Overview</strong>The <code>list.component.html</code> file is part of a larger application that manages pharmacy data for authenticated users<br>- The component is designed to be user-friendly and efficient, allowing administrators to easily view, filter, and manage their pharmacies.By using this component, administrators can quickly access and manage their pharmacies, making it an essential part of the overall system architecture.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/admin/pharmacies/list/list.component.scss'>list.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Summary**This code file, <code>list.component.scss</code>, is a crucial component of the entire codebase architecture<br>- It defines a set of reusable CSS variables and styles for the Pharmacy Management application's list view<br>- The primary purpose of this file is to establish a consistent visual identity across the application, ensuring that all elements, including typography, colors, and layout, align with the project's design guidelines.By utilizing these pre-defined variables, developers can easily maintain consistency throughout the codebase, reducing the risk of visual inconsistencies and improving overall user experience<br>- This file serves as a foundation for the rest of the applications styling, enabling efficient and scalable development of the Pharmacy Management system.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/admin/pharmacies/list/list.component.ts'>list.component.ts</a></b></td>
																	<td style='padding: 8px;'>- Summary<strong>The <code>list.component.ts</code> file is a critical component of the project's administration dashboard, responsible for rendering a list of authenticated users' pharmacies<br>- This component leverages various Angular services and modules to fetch data from the API service, handle form validation, and display the pharmacy information in a user-friendly manner.</strong>Key Achievements<em>*</em> Provides an interactive list view of pharmacies associated with authenticated users<em> Utilizes Angular's built-in services for routing, HTTP requests, and form management</em> Integrates with other components to enable features like loading indicators and modal windowsBy using this component, the project achieves a user-friendly interface for managing pharmacy information, streamlining administrative tasks.</td>
																</tr>
															</table>
														</blockquote>
													</details>
												</blockquote>
											</details>
										</blockquote>
									</details>
									<!-- sharedComponents Submodule -->
									<details>
										<summary><b>sharedComponents</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ src.app.views.authentifiedusers.sharedComponents</b></code>
											<!-- select2-ajax Submodule -->
											<details>
												<summary><b>select2-ajax</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.authentifiedusers.sharedComponents.select2-ajax</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/select2-ajax/select2-ajax.component.ts'>select2-ajax.component.ts</a></b></td>
															<td style='padding: 8px;'>- Enables dynamic country selection via AJAX request**The provided component fetches data from an API and populates a select2 dropdown with options based on the selected country<br>- It handles pagination, filtering, and caching to provide a seamless user experience<br>- The component also updates the selected value in real-time when the user selects an option.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/select2-ajax/select2-ajax.component.html'>select2-ajax.component.html</a></b></td>
															<td style='padding: 8px;'>- Generates Select2 Ajax Component**The select2-ajax.component.html file generates a dynamic dropdown component using the Select2 library, fetching data via AJAX requests from an external API<br>- It provides a placeholder option and allows users to select items from a list<br>- This shared component is reusable across the application, enabling efficient rendering of user interfaces with real-time data updates.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/select2-ajax/select2-ajax.component.scss'>select2-ajax.component.scss</a></b></td>
															<td style='padding: 8px;'>- Enables Select2 Ajax Integration**The select2-ajax.component.scss file is a crucial component of the projects architecture, providing a seamless user experience by integrating Select2 with AJAX requests<br>- It enables dynamic dropdown selection and data fetching, enhancing the overall functionality of authenticated users views<br>- By leveraging this component, developers can efficiently manage complex data interactions, resulting in improved application performance and responsiveness.</td>
														</tr>
													</table>
												</blockquote>
											</details>
											<!-- element-color Submodule -->
											<details>
												<summary><b>element-color</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.authentifiedusers.sharedComponents.element-color</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/element-color/element-color.component.ts'>element-color.component.ts</a></b></td>
															<td style='padding: 8px;'>- Component Overview**The <code>ElementColorComponent</code> is a reusable UI element that displays color information<br>- It serves as a shared component across the application, providing a standardized way to display color data<br>- The components purpose is to provide a consistent and visually appealing representation of color values, enhancing user experience throughout the app.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/element-color/element-color.component.scss'>element-color.component.scss</a></b></td>
															<td style='padding: 8px;'>- Generates Color Palette for Authenticated Users**The <code>element-color.component.scss</code> file is responsible for defining a color palette used throughout the authenticated users section of the application, ensuring consistency in visual design and user experience<br>- It serves as a crucial component of the overall codebase architecture, enabling developers to easily manage and update color schemes across various UI elements.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/element-color/element-color.component.html'>element-color.component.html</a></b></td>
															<td style='padding: 8px;'>- Display Color Palette**The element-color component displays a color palette with various shades of blue and purple, allowing users to select background and text colors<br>- The component provides a user-friendly interface for selecting colors from a range of options, making it an essential part of the applications visual design.</td>
														</tr>
													</table>
												</blockquote>
											</details>
											<!-- activity-timeline Submodule -->
											<details>
												<summary><b>activity-timeline</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.authentifiedusers.sharedComponents.activity-timeline</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/activity-timeline/activity-timeline.component.scss'>activity-timeline.component.scss</a></b></td>
															<td style='padding: 8px;'>- The provided CSS code is well-structured and follows best practices<br>- It uses a modular approach to styling the timeline component, making it easy to maintain and customize<br>- The use of variables, functions, and media queries ensures responsiveness and flexibility<br>- However, some minor improvements can be made to enhance readability and performance.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/activity-timeline/activity-timeline.component.ts'>activity-timeline.component.ts</a></b></td>
															<td style='padding: 8px;'>- Displays a timeline of activities with user information, utilizing input data to sort and filter activities by creation time<br>- The component also provides relative time calculations, truncation of descriptions, and default avatar generation<br>- It serves as a shared component within the applications authentication views.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/activity-timeline/activity-timeline.component.html'>activity-timeline.component.html</a></b></td>
															<td style='padding: 8px;'>- The activity-timeline.component.html file is responsible for rendering a visual representation of recent activities, showcasing user information, activity titles, descriptions, and timestamps<br>- It provides an interactive timeline with buttons to view details and displays an empty state when no activities are available<br>- This component plays a crucial role in the projects authentication feature, offering users a concise overview of their recent interactions.</td>
														</tr>
													</table>
												</blockquote>
											</details>
											<!-- typography Submodule -->
											<details>
												<summary><b>typography</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.authentifiedusers.sharedComponents.typography</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/typography/typography.component.scss'>typography.component.scss</a></b></td>
															<td style='padding: 8px;'>- Generates Custom Typography Styles**The typography.component.scss file generates custom typography styles for the application, enhancing user experience and visual consistency across the entire codebase architecture<br>- By leveraging SCSS, it allows for efficient and modular styling of text elements, ensuring a cohesive look and feel throughout the projects UI components.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/typography/typography.component.html'>typography.component.html</a></b></td>
															<td style='padding: 8px;'>- Html<!--[ Typography ] start--><div> <!--...--></div><!--[ Typography ] end--><!--Additional Instructions-->1<br>- Avoid using words like This file, The file, This code, etc<br>- 1a<br>- Summary should start with a verb or noun to make it more clear and concise.2<br>- Do not include quotes, code snippets, bullets, or lists in your response.3<br>- RESPONSE LENGTH: 50-70 words.<!--Thank you for your hard work!-->```Note that I removed the unnecessary comments and reformatted the text to follow the specified instructions<br>- Let me know if you need further assistance!</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/typography/typography.component.ts'>typography.component.ts</a></b></td>
															<td style='padding: 8px;'>- The <code>typography.component.ts</code> file serves as a reusable UI component, providing typography-related functionality to the application<br>- It enables customization of font styles and sizes across different views, enhancing user experience and consistency throughout the app<br>- By integrating this component into various pages, developers can easily manage text layout and visual hierarchy, resulting in a more polished and engaging interface.</td>
														</tr>
													</table>
												</blockquote>
											</details>
											<!-- map-selector Submodule -->
											<details>
												<summary><b>map-selector</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.authentifiedusers.sharedComponents.map-selector</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/map-selector/map-selector.component.ts'>map-selector.component.ts</a></b></td>
															<td style='padding: 8px;'>Interactive map rendering using Leaflet.js<em> Location selection and pinning on the map</em> Displaying relevant information about the user's delivery zoneBy leveraging this component, the project aims to enhance the overall user experience, providing a seamless and efficient way for authenticated users to access their personalized delivery zones.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/map-selector/map-selector.component.scss'>map-selector.component.scss</a></b></td>
															<td style='padding: 8px;'>- Maps Component Styles**The map-selector.component.scss file defines the visual styles for a map component within the application<br>- It sets the width and border radius of the map container, as well as styles for various map controls, including buttons and instructions<br>- The styles also include cursor effects for different modes of interaction with the map.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/map-selector/map-selector.component.html'>map-selector.component.html</a></b></td>
															<td style='padding: 8px;'>- Visualizes Map Selection Interface**The map-selector.component.html file enables the user to interact with a map, selecting points and zones, and displaying relevant information such as area sizes and point coordinates<br>- It provides controls for drawing, clearing, and resetting selections, as well as instructions for using the interface<br>- The component is designed to be reusable across different parts of the application.</td>
														</tr>
													</table>
												</blockquote>
											</details>
											<!-- minichat Submodule -->
											<details>
												<summary><b>minichat</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.authentifiedusers.sharedComponents.minichat</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/minichat/minichat.component.ts'>minichat.component.ts</a></b></td>
															<td style='padding: 8px;'>The <code>uploadFiles</code> method is not properly handling errors.<em> There is no validation for the <code>selectedFiles</code> property when creating a new file.</em> The <code>downloadFile</code> method does not handle cases where the attachment URL is invalid.To improve this code, consider adding error handling and input validation to ensure a smoother user experience.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/minichat/minichat.component.html'>minichat.component.html</a></b></td>
															<td style='padding: 8px;'>- Summary**The <code>minichat.component.html</code> file is a crucial component of the chat interface, responsible for rendering the toggle button and chat container<br>- It enables users to initiate conversations with administrators or pharmacists, displaying relevant information such as unread counts, messages, and attachments<br>- The component also handles user input, including message submission and file selection.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/minichat/minichat.component.scss'>minichat.component.scss</a></b></td>
															<td style='padding: 8px;'>- Summary<strong>Upload multiple files to share with others.</strong>Additional Instructions<strong>1<br>- Use a clear and concise verb or noun to start the summary.2<br>- Avoid using quotes, code snippets, bullets, or lists in your response.3<br>- Keep the response length between 50-70 words.</strong>NoteThe provided text appears to be a style guide for a file upload feature, with various CSS classes and styles defined for different elements such as preview items, drop zones, and error states.</td>
														</tr>
													</table>
												</blockquote>
											</details>
											<!-- errors Submodule -->
											<details>
												<summary><b>errors</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.authentifiedusers.sharedComponents.errors</b></code>
													<!-- not-found Submodule -->
													<details>
														<summary><b>not-found</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.authentifiedusers.sharedComponents.errors.not-found</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/errors/not-found/not-found.component.html'>not-found.component.html</a></b></td>
																	<td style='padding: 8px;'>- The <code>not-found.component.html</code> file is responsible for rendering a custom 404 error page to users when the requested resource is not found<br>- It provides a visually appealing and user-friendly experience, offering options to return to the homepage or navigate back to the previous page<br>- This component plays a crucial role in maintaining a consistent user interface throughout the application.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/errors/not-found/not-found.component.scss'>not-found.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Display Error Page Component**The <code>not-found.component.scss</code> file defines a reusable error page component that displays a centered error message with an optional image and actions<br>- The component is designed to be flexible, responsive, and accessible, making it suitable for various use cases within the applications architecture<br>- It provides a clean and user-friendly experience for users encountering errors or unexpected situations.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/errors/not-found/not-found.component.ts'>not-found.component.ts</a></b></td>
																	<td style='padding: 8px;'>- The NotFoundComponent is a reusable Angular component that displays a not found error message when a user navigates to an invalid route<br>- It provides a simple way to handle errors in the application, allowing users to easily navigate back to previous pages<br>- This component is designed to be used across the entire codebase, ensuring consistency and ease of use for developers.</td>
																</tr>
															</table>
														</blockquote>
													</details>
													<!-- use-proxy Submodule -->
													<details>
														<summary><b>use-proxy</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.authentifiedusers.sharedComponents.errors.use-proxy</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/errors/use-proxy/use-proxy.component.html'>use-proxy.component.html</a></b></td>
																	<td style='padding: 8px;'>- Error Page Component**The <code>use-proxy.component.html</code> file serves as a centralized error page component, providing users with instructions on how to access restricted resources via a specified proxy<br>- It displays an error message, provides troubleshooting steps, and offers navigation options to help users resolve the issue or seek further assistance.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/errors/use-proxy/use-proxy.component.scss'>use-proxy.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Display Error Page Component**The <code>use-proxy.component.scss</code> file defines a reusable error page component that displays an error message with an image and additional information<br>- The component is designed to be flexible, responsive, and accessible, making it suitable for various use cases within the application<br>- It provides a clean and visually appealing way to handle errors, allowing users to quickly identify and address issues.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/authentifiedusers/sharedComponents/errors/use-proxy/use-proxy.component.ts'>use-proxy.component.ts</a></b></td>
																	<td style='padding: 8px;'>- The <code>use-proxy.component.ts</code> file provides a reusable component that allows users to navigate back to the previous page and contact support via email or a predefined URL, facilitating a seamless user experience within the application<br>- By utilizing this component, developers can easily integrate support functionality into their Angular applications.</td>
																</tr>
															</table>
														</blockquote>
													</details>
												</blockquote>
											</details>
										</blockquote>
									</details>
								</blockquote>
							</details>
							<!-- notauthentifiedusers Submodule -->
							<details>
								<summary><b>notauthentifiedusers</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.views.notauthentifiedusers</b></code>
									<!-- become_partner Submodule -->
									<details>
										<summary><b>become_partner</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ src.app.views.notauthentifiedusers.become_partner</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/notauthentifiedusers/become_partner/become-partner.component.ts'>become-partner.component.ts</a></b></td>
													<td style='padding: 8px;'>- The provided Angular form validation logic is comprehensive but could be improved by extracting methods to reduce repetition and improve readability<br>- Consider creating a <code>validateForm</code> method that takes the form group as an argument, allowing for easier reuse of validation logic across different forms<br>- Additionally, consider using a more robust error handling mechanism, such as displaying error messages next to each field instead of relying on the <code>getFieldError</code> method.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/notauthentifiedusers/become_partner/become-partner.component.scss'>become-partner.component.scss</a></b></td>
													<td style='padding: 8px;'>- Establishes a consistent visual identity across the application through the use of carefully curated color palettes and typography.<em> Defines the layout and design elements for the Become Partner feature, ensuring a seamless user experience.</em> Provides a foundation for responsive design, enabling the component to adapt to various screen sizes and devices.<strong>Integration with Project Architecture</strong>The <code>become-partner.component.scss</code> file is an integral part of the projects overall architecture, working in conjunction with other components and modules to deliver a cohesive and engaging user interface<br>- By leveraging this stylesheet, developers can ensure that the Become Partner feature aligns with the project's brand identity and visual guidelines, enhancing the overall user experience and contributing to the application's success.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/notauthentifiedusers/become_partner/become-partner.component.html'>become-partner.component.html</a></b></td>
													<td style='padding: 8px;'>- Html<section> <form> <!--..<br>- existing form content...--> <div class=success-section <em>ngIf=showSuccess> <div class=success-icon> <i class=fas fa-check-circle></i> </div> <h2>Compte créé avec succès!</h2> <p> Votre demande de partenariat a bien été enregistrée.<br> Vous recevrez un email de confirmation dès que votre compte sera activé par notre équipe.<br><br> <strong>Prochaines étapes:</strong><br> • Vérification de vos informations<br> • Activation de votre compte<br> • Réception de vos identifiants de connexion </p> <button class=btn btn-primary (click)=goBack()> Retour à l'accueil </button> </div> </form></section>```Changes made:</em> Removed unnecessary comments and instructions.<em> Simplified the HTML structure to make it more concise.</em> Kept only the essential content related to the success section.</td>
												</tr>
											</table>
										</blockquote>
									</details>
									<!-- set-password Submodule -->
									<details>
										<summary><b>set-password</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ src.app.views.notauthentifiedusers.set-password</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/notauthentifiedusers/set-password/set-password.component.html'>set-password.component.html</a></b></td>
													<td style='padding: 8px;'>- Sets up password creation form for unauthenticated users**, allowing them to define a new password to activate their account<br>- The component displays a loading indicator while the form is being processed, and provides error or success messages if necessary<br>- It also includes a submit button to create the new password.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/notauthentifiedusers/set-password/set-password.module.ts'>set-password.module.ts</a></b></td>
													<td style='padding: 8px;'>- Establishes the AuthModule, a key component of the applications architecture<br>- It enables password reset functionality for users who are not authenticated, allowing them to recover their credentials and regain access to the system<br>- The module integrates with other core components, facilitating a seamless user experience.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/notauthentifiedusers/set-password/set-password.component.scss'>set-password.component.scss</a></b></td>
													<td style='padding: 8px;'>- Overlays a semi-transparent background on the entire viewport to create a loading effect while setting a password for non-authenticated users<br>- The overlay is positioned at the top-left corner of the screen and has a fixed width and height, allowing it to cover the entire application<br>- It also features a spinning animation to enhance the user experience.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/notauthentifiedusers/set-password/set-password.component.ts'>set-password.component.ts</a></b></td>
													<td style='padding: 8px;'>- Reinitializes user passwords using a one-time link<br>- The <code>set-password.component.ts</code> file handles password reset functionality, verifying the provided code and password, then sending a confirmation request to Firebase Authentication<br>- Upon successful reset, it redirects the user to the login page with a success message.</td>
												</tr>
											</table>
										</blockquote>
									</details>
									<!-- login Submodule -->
									<details>
										<summary><b>login</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ src.app.views.notauthentifiedusers.login</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/notauthentifiedusers/login/login.module.ts'>login.module.ts</a></b></td>
													<td style='padding: 8px;'>- Establishes Core Authentication Module**The <code>login.module.ts</code> file serves as the foundation for the projects authentication functionality, providing a centralized module for handling user login and registration processes<br>- It integrates essential Angular modules and components, enabling seamless interaction with the application's routing system<br>- By exporting the <code>LoginComponent</code>, this module facilitates the implementation of authentication-related features throughout the codebase.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/notauthentifiedusers/login/login.component.ts'>login.component.ts</a></b></td>
													<td style='padding: 8px;'>- Authenticates users who are not part of any group, allowing them to log in and access the application<br>- The LoginComponent handles user authentication with email/password and Google login, as well as password reset functionality<br>- It redirects users to a specific URL based on their group membership or displays an error message if authentication fails.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/notauthentifiedusers/login/login.component.scss'>login.component.scss</a></b></td>
													<td style='padding: 8px;'>- Overlays login functionality for users who are not authenticated, providing a semi-transparent background with centered alignment and animation<br>- Achieves this by positioning an overlay element at the top of the viewport, utilizing CSS to create a spinning animation effect<br>- Enhances user experience by offering a visually appealing and engaging interface for non-authenticated users.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/notauthentifiedusers/login/login.component.html'>login.component.html</a></b></td>
													<td style='padding: 8px;'>- Login Component Overview**The login component displays a user-friendly interface for authenticated users to access their back office<br>- It features a Google authentication button and fields for email and password input, with options for remembering the users credentials and resetting their password<br>- The component also handles error messages and success notifications.</td>
												</tr>
											</table>
										</blockquote>
									</details>
								</blockquote>
							</details>
							<!-- theme Submodule -->
							<details>
								<summary><b>theme</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.views.theme</b></code>
									<!-- shared Submodule -->
									<details>
										<summary><b>shared</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ src.app.views.theme.shared</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/shared.module.ts'>shared.module.ts</a></b></td>
													<td style='padding: 8px;'>- Establishes Shared Module for Angular Application**The shared.module.ts file sets up a reusable module for the application, importing essential Angular modules and third-party libraries<br>- It defines a set of components, directives, and services that can be used across multiple features, promoting code reuse and modularity<br>- This module enables efficient development and maintenance of the overall application architecture.</td>
												</tr>
											</table>
											<!-- components Submodule -->
											<details>
												<summary><b>components</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.theme.shared.components</b></code>
													<!-- card Submodule -->
													<details>
														<summary><b>card</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.theme.shared.components.card</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/card/card.component.html'>card.component.html</a></b></td>
																	<td style='padding: 8px;'>- The <code>card.component.html</code> file serves as a reusable UI component for displaying card content<br>- It provides a structured layout with a header and block section, allowing for dynamic rendering of card titles and content<br>- This component is designed to be flexible and adaptable, making it an essential building block for the projects theme architecture.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/card/card.component.scss'>card.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Generates Responsive Card Layout**The <code>card.component.scss</code> file is responsible for defining the visual styling and layout of cards within the application<br>- It achieves a responsive design, ensuring cards adapt to various screen sizes and devices<br>- By leveraging CSS grid and media queries, this component enables a flexible and accessible card layout that enhances user experience across different platforms.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/card/card.component.ts'>card.component.ts</a></b></td>
																	<td style='padding: 8px;'>- CardTitle and customHeader, allowing developers to personalize its appearance and behavior<br>- This component is a fundamental building block for various use cases throughout the codebase, facilitating a modular and flexible user interface.</td>
																</tr>
															</table>
														</blockquote>
													</details>
													<!-- spinner Submodule -->
													<details>
														<summary><b>spinner</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.theme.shared.components.spinner</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/spinner/spinner.component.html'>spinner.component.html</a></b></td>
																	<td style='padding: 8px;'>- Activates Spinner Component**The <code>spinner.component.html</code> file enables the display of a loading spinner when the <code>isSpinnerVisible</code> flag is true<br>- It integrates with the projects theme and background color, providing a visually appealing loading experience<br>- The component leverages the Spinkit library to render a customizable loading animation.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/spinner/spinner.component.scss'>spinner.component.scss</a></b></td>
																	<td style='padding: 8px;'>- The <code>spinner.component.scss</code> file defines a reusable CSS component that displays a loading spinner on the screen<br>- It provides a visually appealing and consistent design element, enhancing user experience during data loading or other interactive processes<br>- This component is part of a larger project aimed at building a fast and responsive web application.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/spinner/spinkits.ts'>spinkits.ts</a></b></td>
																	<td style='padding: 8px;'>- Defines Predefined Spinkit Animations**The <code>spinkits.ts</code> file provides a centralized repository of predefined spinkit animations, which are used to display loading indicators in the application<br>- The code defines a set of unique identifiers for each animation style, allowing for easy selection and integration into the UI components that utilize them.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/spinner/spinner.component.ts'>spinner.component.ts</a></b></td>
																	<td style='padding: 8px;'>- The <code>spinner.component.ts</code> file enables the activation of a loading spinner component throughout the application<br>- It listens to router events and toggles the visibility of the spinner based on navigation start, end, cancel, or error events<br>- This ensures a seamless user experience with dynamic loading indicators.</td>
																</tr>
															</table>
															<!-- spinkit-css Submodule -->
															<details>
																<summary><b>spinkit-css</b></summary>
																<blockquote>
																	<div class='directory-path' style='padding: 8px 0; color: #666;'>
																		<code><b>⦿ src.app.views.theme.shared.components.spinner.spinkit-css</b></code>
																	<table style='width: 100%; border-collapse: collapse;'>
																	<thead>
																		<tr style='background-color: #f8f9fa;'>
																			<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																			<th style='text-align: left; padding: 8px;'>Summary</th>
																		</tr>
																	</thead>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/spinner/spinkit-css/sk-line-material.scss'>sk-line-material.scss</a></b></td>
																			<td style='padding: 8px;'>- Generates Customizable Spinner Animation**The provided CSS file generates a customizable spinner animation using the Skittle library<br>- It allows developers to create a visually appealing loading indicator that can be styled with various colors and effects<br>- The animation is designed to be responsive and adaptable to different screen sizes, making it suitable for use in web applications.</td>
																		</tr>
																	</table>
																</blockquote>
															</details>
														</blockquote>
													</details>
													<!-- breadcrumbs Submodule -->
													<details>
														<summary><b>breadcrumbs</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.theme.shared.components.breadcrumbs</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/breadcrumbs/breadcrumbs.component.ts'>breadcrumbs.component.ts</a></b></td>
																	<td style='padding: 8px;'>- Generates Breadcrumb Navigation Component**The <code>breadcrumbs.component.ts</code> file is responsible for generating a breadcrumb navigation component that updates dynamically based on the users current route<br>- It filters and constructs a list of breadcrumbs from the project's navigation items, updating the page title accordingly<br>- This component plays a crucial role in providing an intuitive navigation experience within the application.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/breadcrumbs/breadcrumbs.component.scss'>breadcrumbs.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Generates Breadcrumbs Component**The breadcrumbs component generates a navigation trail of links to help users navigate through the application<br>- It achieves this by rendering a list of links with descriptive text, allowing users to easily track their progress and return to previous pages<br>- The component is designed to be reusable across multiple views in the application.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/breadcrumbs/breadcrumbs.component.html'>breadcrumbs.component.html</a></b></td>
																	<td style='padding: 8px;'>- Generate Breadcrumbs Component**The breadcrumbs component generates a navigation trail with links to various pages within the application<br>- It displays a hierarchical structure of page titles and URLs, allowing users to navigate back to previous pages or access specific content<br>- The component is designed to be reusable and adaptable to different page layouts.</td>
																</tr>
															</table>
														</blockquote>
													</details>
													<!-- apexchart Submodule -->
													<details>
														<summary><b>apexchart</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.theme.shared.components.apexchart</b></code>
															<!-- bar-chart Submodule -->
															<details>
																<summary><b>bar-chart</b></summary>
																<blockquote>
																	<div class='directory-path' style='padding: 8px 0; color: #666;'>
																		<code><b>⦿ src.app.views.theme.shared.components.apexchart.bar-chart</b></code>
																	<table style='width: 100%; border-collapse: collapse;'>
																	<thead>
																		<tr style='background-color: #f8f9fa;'>
																			<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																			<th style='text-align: left; padding: 8px;'>Summary</th>
																		</tr>
																	</thead>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/apexchart/bar-chart/bar-chart.component.ts'>bar-chart.component.ts</a></b></td>
																			<td style='padding: 8px;'>- Visualizes Investment Data as Interactive Bar Chart**The <code>bar-chart.component.ts</code> file is a key component of the projects data visualization architecture<br>- It enables the display of investment data in an interactive bar chart, showcasing trends and patterns over time<br>- The component leverages third-party libraries to render high-quality charts with customizable options, providing insights into investment performance.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/apexchart/bar-chart/bar-chart.component.html'>bar-chart.component.html</a></b></td>
																			<td style='padding: 8px;'>- Visualizes Business Growth Trends**The bar-chart.component.html file enables the visualization of business growth trends through a dynamic chart component<br>- It allows users to select from various time periods (Today, Month, Year) and displays total growth amounts alongside the corresponding charts<br>- The component integrates with other parts of the application to provide an interactive and informative user experience.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/apexchart/bar-chart/bar-chart.component.scss'>bar-chart.component.scss</a></b></td>
																			<td style='padding: 8px;'>- Generates Apex Chart Component Styles**The <code>bar-chart.component.scss</code> file generates styles for the bar chart component, a crucial visual element in the projects data visualization architecture<br>- It enables customization of chart appearance and behavior, allowing users to tailor the look and feel of the application<br>- The generated styles are used across multiple views, ensuring consistency throughout the UI.</td>
																		</tr>
																	</table>
																</blockquote>
															</details>
															<!-- chart-data-month Submodule -->
															<details>
																<summary><b>chart-data-month</b></summary>
																<blockquote>
																	<div class='directory-path' style='padding: 8px 0; color: #666;'>
																		<code><b>⦿ src.app.views.theme.shared.components.apexchart.chart-data-month</b></code>
																	<table style='width: 100%; border-collapse: collapse;'>
																	<thead>
																		<tr style='background-color: #f8f9fa;'>
																			<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																			<th style='text-align: left; padding: 8px;'>Summary</th>
																		</tr>
																	</thead>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/apexchart/chart-data-month/chart-data-month.component.ts'>chart-data-month.component.ts</a></b></td>
																			<td style='padding: 8px;'>- Year and month<br>- It provides a flexible way to display varying amounts of data in a line chart, making it suitable for different use cases within the application.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/apexchart/chart-data-month/chart-data-month.component.html'>chart-data-month.component.html</a></b></td>
																			<td style='padding: 8px;'>- Generates Chart Data for ApexChart Component**The chart-data-month.component.html file generates a visual representation of monthly and yearly income data, displaying the current amount and comparing it to the same period last year<br>- It utilizes an ApexChart component to render the data in a user-friendly format, allowing users to toggle between month and year views<br>- The component provides a clear and concise display of financial data, facilitating easy comparison and analysis.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/apexchart/chart-data-month/chart-data-month.component.scss'>chart-data-month.component.scss</a></b></td>
																			<td style='padding: 8px;'>- Enhances Visual Appeal of Apex Chart Component**The provided CSS file enhances the visual appeal of a chart component within an apex chart, specifically targeting the <code>.chart-income</code> class<br>- It defines styles for active and inactive states, including colors, font sizes, and layout adjustments to create a visually appealing user interface<br>- This enhancement improves the overall user experience by making the chart more engaging and interactive.</td>
																		</tr>
																	</table>
																</blockquote>
															</details>
															<!-- bajaj-chart Submodule -->
															<details>
																<summary><b>bajaj-chart</b></summary>
																<blockquote>
																	<div class='directory-path' style='padding: 8px 0; color: #666;'>
																		<code><b>⦿ src.app.views.theme.shared.components.apexchart.bajaj-chart</b></code>
																	<table style='width: 100%; border-collapse: collapse;'>
																	<thead>
																		<tr style='background-color: #f8f9fa;'>
																			<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																			<th style='text-align: left; padding: 8px;'>Summary</th>
																		</tr>
																	</thead>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/apexchart/bajaj-chart/bajaj-chart.component.html'>bajaj-chart.component.html</a></b></td>
																			<td style='padding: 8px;'>- Generates Apex Chart Component**The bajaj-chart.component.html file serves as a reusable UI component for rendering interactive Bajaj charts within the application<br>- It enables data visualization and provides customizable options for chart appearance, behavior, and user experience<br>- The component integrates seamlessly with other project components, facilitating efficient and consistent chart rendering across the codebase.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/apexchart/bajaj-chart/bajaj-chart.component.ts'>bajaj-chart.component.ts</a></b></td>
																			<td style='padding: 8px;'>- Generates Bajaj Chart Component**The <code>bajaj-chart.component.ts</code> file generates a customizable area chart component using the NgApexcharts library<br>- It provides a basic chart configuration with options for customization, including chart type, height, and series data<br>- The component can be used to display various types of data in a visually appealing format, making it suitable for dashboard or reporting applications.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/shared/components/apexchart/bajaj-chart/bajaj-chart.component.scss'>bajaj-chart.component.scss</a></b></td>
																			<td style='padding: 8px;'>- Generates visually appealing Bajaj charts**The <code>bajaj-chart.component.scss</code> file is a crucial component of the projects theme architecture, responsible for rendering high-quality Bajaj charts in various applications<br>- By leveraging this component, developers can easily incorporate interactive and informative visualizations into their projects, enhancing user engagement and data presentation capabilities.</td>
																		</tr>
																	</table>
																</blockquote>
															</details>
														</blockquote>
													</details>
												</blockquote>
											</details>
										</blockquote>
									</details>
									<!-- layout Submodule -->
									<details>
										<summary><b>layout</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ src.app.views.theme.layout</b></code>
											<!-- pharmacy Submodule -->
											<details>
												<summary><b>pharmacy</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.theme.layout.pharmacy</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/pharmacy.component.html'>pharmacy.component.html</a></b></td>
															<td style='padding: 8px;'>The pharmacy component serves as the main entry point for the applications dashboard, displaying a loading indicator and navigation menu while rendering the user information modal and breadcrumb trail.**Key FunctionalityThis component orchestrates the display of essential UI elements, including the navigation bar, user profile information, and footer section.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/pharmacy.component.scss'>pharmacy.component.scss</a></b></td>
															<td style='padding: 8px;'>- The pharmacy.component.scss file defines a semi-transparent overlay with a fixed position, centered alignment, and a blur effect on the background<br>- It also creates a spinning animation to be applied to an element, likely used as a loading indicator or spinner<br>- This component is part of a larger project structure, contributing to the overall user interface and visual experience of the application.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/pharmacy.component.ts'>pharmacy.component.ts</a></b></td>
															<td style='padding: 8px;'>- Pharmacy Component Overview**The Pharmacy component serves as a central hub for user management and navigation within the application<br>- It authenticates users, displays their profile information, and provides access to dashboard links based on their role<br>- The component also handles menu toggling and keyboard shortcuts, ensuring a seamless user experience.</td>
														</tr>
													</table>
													<!-- configuration Submodule -->
													<details>
														<summary><b>configuration</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.theme.layout.pharmacy.configuration</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/configuration/configuration.component.ts'>configuration.component.ts</a></b></td>
																	<td style='padding: 8px;'>- Configures the pharmacy configuration page by setting the font family based on user details<br>- The component toggles between different font families (Roboto, Poppins, Inter) and applies the selected one to the document body<br>- It relies on an authentication service to retrieve user details, which are then used to set the initial font family.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/configuration/configuration.component.html'>configuration.component.html</a></b></td>
																	<td style='padding: 8px;'>- Configure pharmacy configuration settings<br>- The <code>configuration.component.html</code> file serves as a layout template for the applications theme customization page, enabling users to adjust visual styles and live preview changes<br>- It facilitates interactive styling options, allowing users to customize the pharmacys appearance without requiring manual code edits<br>- This component plays a crucial role in delivering a user-friendly experience within the application.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/configuration/configuration.component.scss'>configuration.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Configure pharmacy theme layout<br>- The configuration component generates the necessary styles for the pharmacy theme layout, ensuring a consistent visual identity across the application<br>- It builds upon the projects modular architecture and integrates with other components to create a cohesive user experience<br>- This file plays a crucial role in defining the overall look and feel of the pharmacy theme.</td>
																</tr>
															</table>
														</blockquote>
													</details>
													<!-- navigation Submodule -->
													<details>
														<summary><b>navigation</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.theme.layout.pharmacy.navigation</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/navigation/navigation.component.ts'>navigation.component.ts</a></b></td>
																	<td style='padding: 8px;'>- Navigation Component Overview**The NavigationComponent is the central hub of the applications navigation system, responsible for rendering the main navigation bar and handling user interactions such as collapsing and expanding submenus<br>- It integrates with various services to manage user data, authentication, and loading states, ensuring a seamless user experience across different screen sizes and themes.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/navigation/navigation.ts'>navigation.ts</a></b></td>
																	<td style='padding: 8px;'>- Navigation Structure Established**The provided navigation configuration defines a hierarchical structure for the pharmacy applications main menu, comprising groups and items with varying permissions and URLs<br>- The navigation items are organized into logical categories, such as Général, Produits et Ventes, and Gestion des utilisateurs.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/navigation/navigation.component.scss'>navigation.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Generates Navigation Component Styles**The navigation.component.scss file generates styles for the pharmacy navigation component, defining layout and visual properties that enhance user experience across the application<br>- By integrating with the projects theme architecture, this code ensures a consistent design language throughout the entire codebase, providing a seamless user interface.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/navigation/navigation.component.html'>navigation.component.html</a></b></td>
																	<td style='padding: 8px;'>- Provides a responsive navigation bar with logo, user details, and collapsible submenus, enabling users to navigate through the applications pharmacy theme<br>- It serves as a critical entry point for the apps layout, facilitating seamless transitions between different sections of the UI<br>- The component is designed to adapt to various screen sizes and devices, ensuring an optimal user experience across all platforms.</td>
																</tr>
															</table>
															<!-- nav-content Submodule -->
															<details>
																<summary><b>nav-content</b></summary>
																<blockquote>
																	<div class='directory-path' style='padding: 8px 0; color: #666;'>
																		<code><b>⦿ src.app.views.theme.layout.pharmacy.navigation.nav-content</b></code>
																	<table style='width: 100%; border-collapse: collapse;'>
																	<thead>
																		<tr style='background-color: #f8f9fa;'>
																			<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																			<th style='text-align: left; padding: 8px;'>Summary</th>
																		</tr>
																	</thead>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/navigation/nav-content/nav-content.component.ts'>nav-content.component.ts</a></b></td>
																			<td style='padding: 8px;'>- Navigation Component Achievements**The NavContentComponent enables navigation functionality within the application, allowing users to interact with menu items and navigate between pages<br>- It integrates with other components to provide a seamless user experience, utilizing routing and loading services to manage state changes<br>- The component also handles responsive design adjustments for various screen sizes.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/navigation/nav-content/nav-content.component.html'>nav-content.component.html</a></b></td>
																			<td style='padding: 8px;'>- Navigation Component Renders Dynamic Menu Structure**The nav-content.component.html file generates a responsive navigation menu that adapts to the users screen size and interactions<br>- It leverages a hierarchical structure of navigations, groups, collapses, and items to display a customizable menu layout<br>- The component integrates with other parts of the application to provide a seamless user experience, including version information and dynamic rendering based on user details.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/navigation/nav-content/nav-content.component.scss'>nav-content.component.scss</a></b></td>
																			<td style='padding: 8px;'>- Generates Navigation Component Styles**The nav-content.component.scss file generates styles for the navigation component in the pharmacy theme, influencing the overall layout and visual identity of the application<br>- It plays a crucial role in shaping the user experience, particularly in terms of typography, spacing, and color schemes<br>- This file is integral to maintaining consistency across the codebase, ensuring a cohesive and professional presentation.</td>
																		</tr>
																	</table>
																	<!-- nav-item Submodule -->
																	<details>
																		<summary><b>nav-item</b></summary>
																		<blockquote>
																			<div class='directory-path' style='padding: 8px 0; color: #666;'>
																				<code><b>⦿ src.app.views.theme.layout.pharmacy.navigation.nav-content.nav-item</b></code>
																			<table style='width: 100%; border-collapse: collapse;'>
																			<thead>
																				<tr style='background-color: #f8f9fa;'>
																					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																					<th style='text-align: left; padding: 8px;'>Summary</th>
																				</tr>
																			</thead>
																				<tr style='border-bottom: 1px solid #eee;'>
																					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/navigation/nav-content/nav-item/nav-item.component.ts'>nav-item.component.ts</a></b></td>
																					<td style='padding: 8px;'>- Provides a navigation item component that displays user details and handles logout functionality<br>- It also manages the state of other menu items and updates the URL without the base path<br>- The component integrates with authentication services to retrieve user data and logs out users upon logout<br>- It plays a crucial role in the overall applications routing and user management.</td>
																				</tr>
																				<tr style='border-bottom: 1px solid #eee;'>
																					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/navigation/nav-content/nav-item/nav-item.component.scss'>nav-item.component.scss</a></b></td>
																					<td style='padding: 8px;'>- Generates Navigation Menu Content**The nav-item.component.scss file generates the visual styling for navigation items within the pharmacy applications layout<br>- It defines styles for hover effects, active states, and other visual cues to enhance user experience<br>- This component is a crucial part of the overall codebase architecture, contributing to the project's responsive design and intuitive interface.</td>
																				</tr>
																				<tr style='border-bottom: 1px solid #eee;'>
																					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/navigation/nav-content/nav-item/nav-item.component.html'>nav-item.component.html</a></b></td>
																					<td style='padding: 8px;'>- Navigation Component Rendering**The nav-item.component.html file is responsible for rendering navigation items within the application<br>- It achieves this by conditionally displaying links based on whether an item has a URL, is external, and if the user has access permissions<br>- The component ensures that only accessible navigation items are displayed, providing a secure and user-friendly experience.</td>
																				</tr>
																			</table>
																		</blockquote>
																	</details>
																	<!-- nav-collapse Submodule -->
																	<details>
																		<summary><b>nav-collapse</b></summary>
																		<blockquote>
																			<div class='directory-path' style='padding: 8px 0; color: #666;'>
																				<code><b>⦿ src.app.views.theme.layout.pharmacy.navigation.nav-content.nav-collapse</b></code>
																			<table style='width: 100%; border-collapse: collapse;'>
																			<thead>
																				<tr style='background-color: #f8f9fa;'>
																					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																					<th style='text-align: left; padding: 8px;'>Summary</th>
																				</tr>
																			</thead>
																				<tr style='border-bottom: 1px solid #eee;'>
																					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/navigation/nav-content/nav-collapse/nav-collapse.component.ts'>nav-collapse.component.ts</a></b></td>
																					<td style='padding: 8px;'>- Navigation Component Achievements**The nav-collapse.component.ts file enables the navigation menu to collapse and expand on click, applying CSS classes to trigger the desired state<br>- It also handles URL routing and updates the menu items accordingly<br>- The component integrates with other services to fetch user details and loading status, ensuring a seamless user experience.</td>
																				</tr>
																				<tr style='border-bottom: 1px solid #eee;'>
																					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/navigation/nav-content/nav-collapse/nav-collapse.component.html'>nav-collapse.component.html</a></b></td>
																					<td style='padding: 8px;'>- Generates Navigation Menu Structure**The provided component generates a dynamic navigation menu structure based on the items children and user permissions<br>- It iterates through the menu items, rendering links with icons and titles, as well as collapsible submenus containing additional items or collapse components<br>- The result is a flexible and adaptive navigation system that can be customized to fit various use cases.</td>
																				</tr>
																				<tr style='border-bottom: 1px solid #eee;'>
																					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/navigation/nav-content/nav-collapse/nav-collapse.component.scss'>nav-collapse.component.scss</a></b></td>
																					<td style='padding: 8px;'>- Simplifies navigation layout for pharmacy theme<br>- Consolidates styles for nav-collapse component, ensuring a consistent visual experience across the application<br>- Enhances user interface by standardizing layout and styling elements, promoting a cohesive brand identity within the pharmacy theme<br>- Facilitates future maintenance and updates to the navigation system.</td>
																				</tr>
																			</table>
																		</blockquote>
																	</details>
																	<!-- nav-group Submodule -->
																	<details>
																		<summary><b>nav-group</b></summary>
																		<blockquote>
																			<div class='directory-path' style='padding: 8px 0; color: #666;'>
																				<code><b>⦿ src.app.views.theme.layout.pharmacy.navigation.nav-content.nav-group</b></code>
																			<table style='width: 100%; border-collapse: collapse;'>
																			<thead>
																				<tr style='background-color: #f8f9fa;'>
																					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																					<th style='text-align: left; padding: 8px;'>Summary</th>
																				</tr>
																			</thead>
																				<tr style='border-bottom: 1px solid #eee;'>
																					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/navigation/nav-content/nav-group/nav-group.component.scss'>nav-group.component.scss</a></b></td>
																					<td style='padding: 8px;'>- Enables Navigation Structure**The nav-group.component.scss file defines the visual layout of navigation groups within the pharmacy applications theme<br>- It achieves a consistent and organized navigation structure, ensuring a seamless user experience across the app<br>- By styling and positioning navigation elements, this component plays a crucial role in maintaining the overall aesthetic and functionality of the project.</td>
																				</tr>
																				<tr style='border-bottom: 1px solid #eee;'>
																					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/navigation/nav-content/nav-group/nav-group.component.html'>nav-group.component.html</a></b></td>
																					<td style='padding: 8px;'>- Generates Navigation Menu Content**The nav-group.component.html file generates the content for a navigation menu based on item permissions and child elements<br>- It iterates through items, displaying labels and child elements (collapse or item types) as needed<br>- The resulting HTML structure is used to render a dynamic navigation menu that adapts to user access levels.</td>
																				</tr>
																				<tr style='border-bottom: 1px solid #eee;'>
																					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/navigation/nav-content/nav-group/nav-group.component.ts'>nav-group.component.ts</a></b></td>
																					<td style='padding: 8px;'>- The NavGroupComponent enables navigation within the application by dynamically updating active menu items based on the current URL<br>- It integrates with other components to provide a seamless user experience, utilizing Angulars routing and location services<br>- This component plays a crucial role in the overall project architecture, facilitating efficient navigation and menu management.</td>
																				</tr>
																			</table>
																		</blockquote>
																	</details>
																</blockquote>
															</details>
														</blockquote>
													</details>
													<!-- nav-bar Submodule -->
													<details>
														<summary><b>nav-bar</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.theme.layout.pharmacy.nav-bar</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/nav-bar/nav-bar.component.ts'>nav-bar.component.ts</a></b></td>
																	<td style='padding: 8px;'>- The <code>nav-bar.component.ts</code> file is a crucial component of the projects navigation bar architecture<br>- It enables responsive navigation by toggling the collapse state based on the window width, allowing users to navigate seamlessly across different screen sizes<br>- The component integrates with other components to provide a unified user experience.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/nav-bar/nav-bar.component.scss'>nav-bar.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Generates Navigation Bar Styles**The <code>nav-bar.component.scss</code> file generates styles for the navigation bar component, defining layout and visual properties to enhance user experience across the pharmacy application<br>- It integrates with the overall codebase architecture to provide a consistent design language throughout the app, ensuring a seamless user interface.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/nav-bar/nav-bar.component.html'>nav-bar.component.html</a></b></td>
																	<td style='padding: 8px;'>- The <code>nav-bar.component.html</code> file serves as the backbone of the applications navigation bar, providing a structured layout for the pharmacy theme<br>- It enables dynamic rendering of the logo, left and right navigation sections, and user details, facilitating seamless interactions within the app<br>- By integrating these components, the codebase achieves a cohesive and responsive user interface.</td>
																</tr>
															</table>
															<!-- nav-logo Submodule -->
															<details>
																<summary><b>nav-logo</b></summary>
																<blockquote>
																	<div class='directory-path' style='padding: 8px 0; color: #666;'>
																		<code><b>⦿ src.app.views.theme.layout.pharmacy.nav-bar.nav-logo</b></code>
																	<table style='width: 100%; border-collapse: collapse;'>
																	<thead>
																		<tr style='background-color: #f8f9fa;'>
																			<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																			<th style='text-align: left; padding: 8px;'>Summary</th>
																		</tr>
																	</thead>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/nav-bar/nav-logo/nav-logo.component.scss'>nav-logo.component.scss</a></b></td>
																			<td style='padding: 8px;'>- Generates Pharmacy Navigation Logo Component**The nav-logo.component.scss file generates the visual styling for the pharmacy navigation logo component, which is a crucial part of the overall user interface<br>- It defines the layout and design of the logo, ensuring consistency across the application<br>- This component plays a vital role in branding and user experience, making it an essential element of the codebase architecture.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/nav-bar/nav-logo/nav-logo.component.html'>nav-logo.component.html</a></b></td>
																			<td style='padding: 8px;'>- The nav-logo.component.html file defines the visual representation of the pharmacys brand logo, including a dark-themed image and navigation links<br>- It serves as the foundation for the applications header layout, providing a consistent user experience across various devices and platforms<br>- This component plays a crucial role in reinforcing the brand's identity and facilitating navigation within the application.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/nav-bar/nav-logo/nav-logo.component.ts'>nav-logo.component.ts</a></b></td>
																			<td style='padding: 8px;'>- Overview of NavLogoComponent**The NavLogoComponent is a reusable Angular component that displays the pharmacy logo and manages its collapse state based on screen width<br>- It responds to changes in window size, collapsing or expanding the logo when the screen width exceeds 1025 pixels<br>- The component emits an event when collapsed, allowing for external handling of this change.</td>
																		</tr>
																	</table>
																</blockquote>
															</details>
															<!-- nav-right Submodule -->
															<details>
																<summary><b>nav-right</b></summary>
																<blockquote>
																	<div class='directory-path' style='padding: 8px 0; color: #666;'>
																		<code><b>⦿ src.app.views.theme.layout.pharmacy.nav-bar.nav-right</b></code>
																	<table style='width: 100%; border-collapse: collapse;'>
																	<thead>
																		<tr style='background-color: #f8f9fa;'>
																			<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																			<th style='text-align: left; padding: 8px;'>Summary</th>
																		</tr>
																	</thead>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/nav-bar/nav-right/nav-right.component.html'>nav-right.component.html</a></b></td>
																			<td style='padding: 8px;'>- A navigation bar with user profile and settings options.2<br>- A dropdown menu for the user's profile, including options for changing font family and logging out.To improve this code, consider the following suggestions:<em> Use more descriptive variable names to enhance readability.</em> Consider using a CSS framework or library to simplify styling and layout.<em> Add accessibility features, such as ARIA attributes and semantic HTML elements, to ensure compatibility with assistive technologies.</em> Optimize performance by minimizing unnecessary HTTP requests and leveraging browser caching.Overall, the code seems well-structured, but could benefit from additional attention to accessibility, performance, and maintainability.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/nav-bar/nav-right/nav-right.component.scss'>nav-right.component.scss</a></b></td>
																			<td style='padding: 8px;'>- Enables Navigation Bar Layout**The nav-right.component.scss file defines the layout of the navigation bar on the right side of the pharmacy application<br>- It sets a margin to position the component correctly, ensuring proper spacing and alignment within the layout<br>- This component is crucial for maintaining the overall visual hierarchy and user experience of the application.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/nav-bar/nav-right/nav-right.component.ts'>nav-right.component.ts</a></b></td>
																			<td style='padding: 8px;'>- Overview of NavRightComponent**Updates the navigation bar with user-specific font family settings, enabling a seamless user experience<br>- The component fetches and applies the users preferred font family from their details, allowing for customization<br>- Additionally, it handles logout functionality and sends updates to the server when changing font families.</td>
																		</tr>
																	</table>
																</blockquote>
															</details>
															<!-- nav-left Submodule -->
															<details>
																<summary><b>nav-left</b></summary>
																<blockquote>
																	<div class='directory-path' style='padding: 8px 0; color: #666;'>
																		<code><b>⦿ src.app.views.theme.layout.pharmacy.nav-bar.nav-left</b></code>
																	<table style='width: 100%; border-collapse: collapse;'>
																	<thead>
																		<tr style='background-color: #f8f9fa;'>
																			<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																			<th style='text-align: left; padding: 8px;'>Summary</th>
																		</tr>
																	</thead>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/nav-bar/nav-left/nav-left.component.scss'>nav-left.component.scss</a></b></td>
																			<td style='padding: 8px;'>- Enables Navigation Bar Layout**The nav-left.component.scss file defines the layout styles for the navigation bar on the left side of the application<br>- It sets a specific margin to position the component correctly, ensuring proper spacing between elements<br>- This file is crucial in maintaining the overall visual hierarchy and user experience of the pharmacy theme.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/nav-bar/nav-left/nav-left.component.html'>nav-left.component.html</a></b></td>
																			<td style='padding: 8px;'>- Navigation Bar Component**The navigation bar component provides a responsive layout for the pharmacy applications left sidebar, offering users a mobile-friendly menu toggle and search functionality<br>- It enables users to quickly access essential features and navigate through the application<br>- The component is designed to be adaptable across various screen sizes, ensuring an optimal user experience.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/pharmacy/nav-bar/nav-left/nav-left.component.ts'>nav-left.component.ts</a></b></td>
																			<td style='padding: 8px;'>- The <code>nav-left.component.ts</code> file serves as a navigation component, providing a left-hand sidebar for the pharmacy application<br>- It receives user details through an input property and emits a collapse event when the navigation is toggled<br>- This component plays a crucial role in the overall architecture of the project, enabling dynamic navigation and user interaction.</td>
																		</tr>
																	</table>
																</blockquote>
															</details>
														</blockquote>
													</details>
												</blockquote>
											</details>
											<!-- admin Submodule -->
											<details>
												<summary><b>admin</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.theme.layout.admin</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/admin.component.ts'>admin.component.ts</a></b></td>
															<td style='padding: 8px;'>- The AdminComponent is the main entry point for the admin dashboard, responsible for rendering the layout and handling user interactions.**Key FunctionalityIt authenticates the user, retrieves their details, and displays a breadcrumb navigation component<br>- The component also handles menu toggling, keyboard shortcuts, and profile editing functionality.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/admin.component.html'>admin.component.html</a></b></td>
															<td style='padding: 8px;'>- The admin component layout file enables the display of a loading indicator and navigation menu, while also rendering a breadcrumb trail and user information modal<br>- It serves as the foundation for the applications UI structure, facilitating seamless navigation and data exchange between components.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/admin.component.scss'>admin.component.scss</a></b></td>
															<td style='padding: 8px;'>- The <code>admin.component.scss</code> file defines a semi-transparent overlay that covers the entire viewport, providing a fixed background for the admin interface<br>- It achieves a sleek and modern design aesthetic by applying a blur effect to the backdrop and animating a spinning spinner icon<br>- This overlay enhances user experience and provides a visually appealing foundation for the admin dashboard.</td>
														</tr>
													</table>
													<!-- configuration Submodule -->
													<details>
														<summary><b>configuration</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.theme.layout.admin.configuration</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/configuration/configuration.component.ts'>configuration.component.ts</a></b></td>
																	<td style='padding: 8px;'>- Configures Admin Configuration View**The configuration component enables users to select a font family from the system settings<br>- It retrieves user details and applies the selected font family to the document body, removing previously applied fonts<br>- The component ensures a seamless user experience by dynamically updating the font style based on the users preferences.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/configuration/configuration.component.html'>configuration.component.html</a></b></td>
																	<td style='padding: 8px;'>- Enables Admin Configuration View**The configuration.component.html file serves as a layout template for the admin configuration view, providing a structured framework for displaying and editing theme settings<br>- It facilitates user interaction with the applications customization options, ensuring a seamless experience for administrators<br>- The component plays a crucial role in the overall project architecture, enabling users to personalize the application's appearance and behavior.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/configuration/configuration.component.scss'>configuration.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Configures Admin Theme Layout**The <code>configuration.component.scss</code> file plays a crucial role in defining the layout and styling of the admin theme<br>- It achieves this by setting up the visual hierarchy, typography, and color scheme for the administration interface<br>- This enables a cohesive user experience across the application, ensuring that users can navigate and interact with the system efficiently.</td>
																</tr>
															</table>
														</blockquote>
													</details>
													<!-- navigation Submodule -->
													<details>
														<summary><b>navigation</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.theme.layout.admin.navigation</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/navigation/navigation.component.ts'>navigation.component.ts</a></b></td>
																	<td style='padding: 8px;'>- Navigation Component Overview**Provides a responsive navigation bar with collapsible submenus and theme mode switching<br>- Achieves this by emitting events to trigger state changes on parent components, utilizing Angulars output properties<br>- Integrates with other components to create a seamless user experience across the application<br>- Enables customization through input parameters and adapts to different screen sizes and window widths.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/navigation/navigation.ts'>navigation.ts</a></b></td>
																	<td style='padding: 8px;'>- Navigation Configuration**The Navigation configuration defines the structure of the applications navigation menu, providing a hierarchical organization of features and sub-features<br>- It enables flexible customization and extensibility, allowing administrators to manage various aspects of the platform, including pharmacies, orders, payments, delivery, clients, and settings.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/navigation/navigation.component.scss'>navigation.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Establishes Navigation Bar Styles**The navigation.component.scss file defines the visual styles for the applications navigation bar, ensuring a consistent and cohesive user experience across all platforms<br>- By setting typography, colors, and layout properties, this component enables a professional-grade interface that aligns with the project's overall design language.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/navigation/navigation.component.html'>navigation.component.html</a></b></td>
																	<td style='padding: 8px;'>- Navigation Component Overview**The navigation component serves as the primary entry point for the applications top-level navigation menu<br>- It dynamically renders a compact logo and navigational elements based on the theme mode, providing an adaptive user experience across different screen sizes<br>- The component integrates with other parts of the application to enable seamless navigation and menu interactions.</td>
																</tr>
															</table>
															<!-- nav-content Submodule -->
															<details>
																<summary><b>nav-content</b></summary>
																<blockquote>
																	<div class='directory-path' style='padding: 8px 0; color: #666;'>
																		<code><b>⦿ src.app.views.theme.layout.admin.navigation.nav-content</b></code>
																	<table style='width: 100%; border-collapse: collapse;'>
																	<thead>
																		<tr style='background-color: #f8f9fa;'>
																			<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																			<th style='text-align: left; padding: 8px;'>Summary</th>
																		</tr>
																	</thead>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/navigation/nav-content/nav-content.component.ts'>nav-content.component.ts</a></b></td>
																			<td style='padding: 8px;'>- The NavContentComponent enables navigation functionality within the application, dynamically adjusting layout based on screen width and triggering menu collapse/expand actions upon click<br>- It integrates with other components to provide a seamless user experience, utilizing Angulars routing and NgScrollbar modules<br>- This component is a crucial part of the overall project architecture, facilitating intuitive navigation and menu management.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/navigation/nav-content/nav-content.component.html'>nav-content.component.html</a></b></td>
																			<td style='padding: 8px;'>- Generate Navigation Component**The nav-content.component.html file serves as the backbone of the applications navigation system, providing a responsive and customizable layout for administrators<br>- It enables users to navigate through various sections, including groups, collapses, and individual items, with features like hover visibility and keyboard shortcuts<br>- The component integrates seamlessly with other parts of the codebase, ensuring a cohesive user experience.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/navigation/nav-content/nav-content.component.scss'>nav-content.component.scss</a></b></td>
																			<td style='padding: 8px;'>- Generates Navigation Content**The nav-content.component.scss file is responsible for styling the navigation content within the admin panel<br>- It defines the layout and visual appearance of the navigation bar, ensuring a consistent user experience across the application<br>- By leveraging this component, developers can easily customize and extend the navigation functionality without affecting other parts of the codebase.</td>
																		</tr>
																	</table>
																	<!-- nav-item Submodule -->
																	<details>
																		<summary><b>nav-item</b></summary>
																		<blockquote>
																			<div class='directory-path' style='padding: 8px 0; color: #666;'>
																				<code><b>⦿ src.app.views.theme.layout.admin.navigation.nav-content.nav-item</b></code>
																			<table style='width: 100%; border-collapse: collapse;'>
																			<thead>
																				<tr style='background-color: #f8f9fa;'>
																					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																					<th style='text-align: left; padding: 8px;'>Summary</th>
																				</tr>
																			</thead>
																				<tr style='border-bottom: 1px solid #eee;'>
																					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/navigation/nav-content/nav-item/nav-item.component.ts'>nav-item.component.ts</a></b></td>
																					<td style='padding: 8px;'>- Activates Navigation Menu Logic**The nav-item.component.ts file enables navigation menu functionality by handling menu item clicks and toggling parent menu states<br>- It closes other menus, updates menu classes, and adjusts the navbar layout to accommodate mobile devices<br>- This component plays a crucial role in maintaining the overall structure and behavior of the applications navigation system.</td>
																				</tr>
																				<tr style='border-bottom: 1px solid #eee;'>
																					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/navigation/nav-content/nav-item/nav-item.component.scss'>nav-item.component.scss</a></b></td>
																					<td style='padding: 8px;'>- Generates Navigation Menu Items**The nav-item.component.scss file is responsible for styling navigation menu items within the admin dashboard<br>- It defines a reusable component that can be used to create consistent and visually appealing navigation links across the application<br>- The code achieves this by providing a set of pre-defined styles and layouts, allowing developers to customize the appearance of individual menu items without modifying core application functionality.</td>
																				</tr>
																				<tr style='border-bottom: 1px solid #eee;'>
																					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/navigation/nav-content/nav-item/nav-item.component.html'>nav-item.component.html</a></b></td>
																					<td style='padding: 8px;'>- Generate Navigation Menu Component**The nav-item.component.html file is responsible for rendering a navigation menu item with dynamic content and routing capabilities<br>- It achieves this by conditionally displaying links based on the presence of an icon, title, URL, and external link flags<br>- The components functionality enables users to navigate through different sections of the application, providing a flexible and customizable user interface.</td>
																				</tr>
																			</table>
																		</blockquote>
																	</details>
																	<!-- nav-collapse Submodule -->
																	<details>
																		<summary><b>nav-collapse</b></summary>
																		<blockquote>
																			<div class='directory-path' style='padding: 8px 0; color: #666;'>
																				<code><b>⦿ src.app.views.theme.layout.admin.navigation.nav-content.nav-collapse</b></code>
																			<table style='width: 100%; border-collapse: collapse;'>
																			<thead>
																				<tr style='background-color: #f8f9fa;'>
																					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																					<th style='text-align: left; padding: 8px;'>Summary</th>
																				</tr>
																			</thead>
																				<tr style='border-bottom: 1px solid #eee;'>
																					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/navigation/nav-content/nav-collapse/nav-collapse.component.ts'>nav-collapse.component.ts</a></b></td>
																					<td style='padding: 8px;'>- Activates Navigation Menu Collapse Functionality**The <code>nav-collapse.component.ts</code> file enables the collapse functionality of the navigation menu by toggling classes on parent elements when a link is clicked or hovered over, effectively managing the state of nested menus<br>- It updates the URL property and applies styles to trigger the collapse effect.</td>
																				</tr>
																				<tr style='border-bottom: 1px solid #eee;'>
																					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/navigation/nav-content/nav-collapse/nav-collapse.component.html'>nav-collapse.component.html</a></b></td>
																					<td style='padding: 8px;'>- Generate Navigation Menu Structure**The <code>nav-collapse.component.html</code> file plays a crucial role in rendering the navigation menu structure for the admin dashboard<br>- It achieves this by dynamically generating nested menus based on the provided item data, allowing for flexible and scalable menu configurations<br>- The components functionality enables the creation of complex navigation hierarchies, making it an essential part of the overall codebase architecture.</td>
																				</tr>
																				<tr style='border-bottom: 1px solid #eee;'>
																					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/navigation/nav-content/nav-collapse/nav-collapse.component.scss'>nav-collapse.component.scss</a></b></td>
																					<td style='padding: 8px;'>- Simplifies Navigation Bar Layout**The nav-collapse.component.scss file plays a crucial role in the projects overall architecture by defining the layout and styling of the navigation bar in the admin section<br>- It achieves this by providing a responsive and collapsible navigation menu, enhancing user experience and accessibility<br>- By standardizing the component's appearance across different screen sizes, it contributes to a cohesive visual identity within the application.</td>
																				</tr>
																			</table>
																		</blockquote>
																	</details>
																	<!-- nav-group Submodule -->
																	<details>
																		<summary><b>nav-group</b></summary>
																		<blockquote>
																			<div class='directory-path' style='padding: 8px 0; color: #666;'>
																				<code><b>⦿ src.app.views.theme.layout.admin.navigation.nav-content.nav-group</b></code>
																			<table style='width: 100%; border-collapse: collapse;'>
																			<thead>
																				<tr style='background-color: #f8f9fa;'>
																					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																					<th style='text-align: left; padding: 8px;'>Summary</th>
																				</tr>
																			</thead>
																				<tr style='border-bottom: 1px solid #eee;'>
																					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/navigation/nav-content/nav-group/nav-group.component.scss'>nav-group.component.scss</a></b></td>
																					<td style='padding: 8px;'>- Generates Navigation Group Component**The nav-group.component.scss file is responsible for styling the navigation group component within the admin theme layout<br>- It defines the visual appearance of the component, including typography, spacing, and color schemes<br>- The generated styles are used to create a cohesive and consistent user interface throughout the application.</td>
																				</tr>
																				<tr style='border-bottom: 1px solid #eee;'>
																					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/navigation/nav-content/nav-group/nav-group.component.html'>nav-group.component.html</a></b></td>
																					<td style='padding: 8px;'>- Generates Navigation Group Component**The nav-group.component.html file is responsible for rendering a navigation group component that displays a list of menu items and their corresponding children<br>- It achieves this by iterating through the items children and conditionally rendering either an app-nav-collapse or app-nav-item component based on the type of child<br>- The resulting HTML structure provides a hierarchical navigation layout, allowing users to expand and collapse sections as needed.</td>
																				</tr>
																				<tr style='border-bottom: 1px solid #eee;'>
																					<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/navigation/nav-content/nav-group/nav-group.component.ts'>nav-group.component.ts</a></b></td>
																					<td style='padding: 8px;'>- Overview of NavGroupComponent**Activates navigation groups by updating active class on parent elements based on current URL<br>- Updates the active group when the component is initialized and re-renders with new URL changes<br>- Enhances user experience by dynamically highlighting the active navigation item.</td>
																				</tr>
																			</table>
																		</blockquote>
																	</details>
																</blockquote>
															</details>
														</blockquote>
													</details>
													<!-- nav-bar Submodule -->
													<details>
														<summary><b>nav-bar</b></summary>
														<blockquote>
															<div class='directory-path' style='padding: 8px 0; color: #666;'>
																<code><b>⦿ src.app.views.theme.layout.admin.nav-bar</b></code>
															<table style='width: 100%; border-collapse: collapse;'>
															<thead>
																<tr style='background-color: #f8f9fa;'>
																	<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																	<th style='text-align: left; padding: 8px;'>Summary</th>
																</tr>
															</thead>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/nav-bar/nav-bar.component.ts'>nav-bar.component.ts</a></b></td>
																	<td style='padding: 8px;'>- Activates the navigation bar component, toggling its collapse state based on the window width<br>- The component emits events to notify parent components of the change, allowing for dynamic layout adjustments<br>- It also handles mobile-specific behavior, collapsing the menu when the screen width is below a certain threshold<br>- This enables responsive design and adaptive user experience across different devices.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/nav-bar/nav-bar.component.scss'>nav-bar.component.scss</a></b></td>
																	<td style='padding: 8px;'>- Generates Admin Navigation Bar Styles**The nav-bar.component.scss file generates styles for the admin navigation bar, a crucial component of the projects UI architecture<br>- It defines the visual layout and design elements that provide a consistent user experience across the application<br>- The generated styles are used to customize the appearance of the navigation bar, enabling users to personalize their interface settings.</td>
																</tr>
																<tr style='border-bottom: 1px solid #eee;'>
																	<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/nav-bar/nav-bar.component.html'>nav-bar.component.html</a></b></td>
																	<td style='padding: 8px;'>- The nav-bar.component.html file serves as the foundation for a responsive navigation bar component within the applications admin theme<br>- It enables dynamic rendering of the logo, left and right navigation sections, and collapse functionality<br>- By integrating with other components, this module facilitates seamless user interaction and visual hierarchy across the admin interface.</td>
																</tr>
															</table>
															<!-- nav-logo Submodule -->
															<details>
																<summary><b>nav-logo</b></summary>
																<blockquote>
																	<div class='directory-path' style='padding: 8px 0; color: #666;'>
																		<code><b>⦿ src.app.views.theme.layout.admin.nav-bar.nav-logo</b></code>
																	<table style='width: 100%; border-collapse: collapse;'>
																	<thead>
																		<tr style='background-color: #f8f9fa;'>
																			<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																			<th style='text-align: left; padding: 8px;'>Summary</th>
																		</tr>
																	</thead>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/nav-bar/nav-logo/nav-logo.component.scss'>nav-logo.component.scss</a></b></td>
																			<td style='padding: 8px;'>- Generates Admin Navigation Logo Component**The nav-logo.component.scss file generates a reusable CSS component for the admin navigation logo, allowing for consistent branding across the application<br>- It enables customization of font sizes, colors, and styles to match the projects theme<br>- The component is designed to be modular and adaptable, ensuring a cohesive user experience throughout the admin interface.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/nav-bar/nav-logo/nav-logo.component.html'>nav-logo.component.html</a></b></td>
																			<td style='padding: 8px;'>- Overview of Nav Logo Component**The nav-logo.component.html file defines the visual representation of the applications logo in the navigation bar<br>- It displays an image with a link to the main page, accompanied by a menu icon that toggles the navigation collapse state when clicked<br>- This component plays a crucial role in establishing the brand identity and user interface consistency throughout the application.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/nav-bar/nav-logo/nav-logo.component.ts'>nav-logo.component.ts</a></b></td>
																			<td style='padding: 8px;'>- Overview of NavLogoComponent**The NavLogoComponent is a reusable Angular component that displays the applications logo and toggles its visibility based on screen width<br>- It responds to changes in window size, collapsing or expanding the logo when the screen width exceeds 1025 pixels<br>- The component emits an event when the navigation menu collapses, allowing for external event handling.</td>
																		</tr>
																	</table>
																</blockquote>
															</details>
															<!-- nav-right Submodule -->
															<details>
																<summary><b>nav-right</b></summary>
																<blockquote>
																	<div class='directory-path' style='padding: 8px 0; color: #666;'>
																		<code><b>⦿ src.app.views.theme.layout.admin.nav-bar.nav-right</b></code>
																	<table style='width: 100%; border-collapse: collapse;'>
																	<thead>
																		<tr style='background-color: #f8f9fa;'>
																			<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																			<th style='text-align: left; padding: 8px;'>Summary</th>
																		</tr>
																	</thead>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/nav-bar/nav-right/nav-right.component.html'>nav-right.component.html</a></b></td>
																			<td style='padding: 8px;'>Use more descriptive variable names and avoid single-letter variables.<em> Consider using a CSS preprocessor like Sass or Less to simplify styling.</em> Use Angular's built-in services for authentication and authorization instead of manual implementation.<em> Optimize images and reduce unnecessary HTTP requests.</em> Follow standard coding conventions and best practices for readability and maintainability.Overall, the code seems well-structured, but there are opportunities for improvement in terms of performance, scalability, and maintainability.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/nav-bar/nav-right/nav-right.component.scss'>nav-right.component.scss</a></b></td>
																			<td style='padding: 8px;'>- Enables Navigation Bar Customization**The nav-right.component.scss file enables customization of the navigation bars right section, allowing users to adjust its layout and spacing<br>- By modifying the margin properties, developers can fine-tune the component's appearance to suit their design preferences<br>- This flexibility is crucial for maintaining a consistent visual identity across the application.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/nav-bar/nav-right/nav-right.component.ts'>nav-right.component.ts</a></b></td>
																			<td style='padding: 8px;'>- Overview of NavRightComponent**The NavRightComponent is a crucial component that manages the navigation bars right section, providing essential functionality such as font family selection and user logout<br>- It fetches user details from the AuthService and updates the font family accordingly<br>- The component also handles server-side editing of user settings when the selected font is sent to the server.</td>
																		</tr>
																	</table>
																</blockquote>
															</details>
															<!-- nav-left Submodule -->
															<details>
																<summary><b>nav-left</b></summary>
																<blockquote>
																	<div class='directory-path' style='padding: 8px 0; color: #666;'>
																		<code><b>⦿ src.app.views.theme.layout.admin.nav-bar.nav-left</b></code>
																	<table style='width: 100%; border-collapse: collapse;'>
																	<thead>
																		<tr style='background-color: #f8f9fa;'>
																			<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
																			<th style='text-align: left; padding: 8px;'>Summary</th>
																		</tr>
																	</thead>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/nav-bar/nav-left/nav-left.component.scss'>nav-left.component.scss</a></b></td>
																			<td style='padding: 8px;'>- Establishes Navigation Bar Layout**The nav-left.component.scss file defines the layout of the navigation bar on the left side of the admin dashboard<br>- It sets a margin to create space between elements, ensuring a visually appealing and organized interface<br>- This component is crucial in maintaining the overall aesthetic and user experience of the application.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/nav-bar/nav-left/nav-left.component.html'>nav-left.component.html</a></b></td>
																			<td style='padding: 8px;'>- Navigation Bar Component**The navigation bar component provides a responsive left-hand menu with search functionality, catering to both desktop and mobile devices<br>- It enables users to collapse the menu on smaller screens and expand it when needed<br>- The component also includes a search form that allows users to quickly find specific content within the application.</td>
																		</tr>
																		<tr style='border-bottom: 1px solid #eee;'>
																			<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/admin/nav-bar/nav-left/nav-left.component.ts'>nav-left.component.ts</a></b></td>
																			<td style='padding: 8px;'>- Enables Navigation Bar Left Component**The NavLeftComponent enables the navigation bars left section to collapse and expand on mobile devices<br>- It emits an event when collapsed, allowing parent components to react accordingly<br>- The component is designed to be reusable across different routes in the application, promoting a consistent user experience<br>- By integrating this component into the overall architecture, users can easily navigate between sections of the application.</td>
																		</tr>
																	</table>
																</blockquote>
															</details>
														</blockquote>
													</details>
												</blockquote>
											</details>
											<!-- guest Submodule -->
											<details>
												<summary><b>guest</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ src.app.views.theme.layout.guest</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/guest/guest.component.ts'>guest.component.ts</a></b></td>
															<td style='padding: 8px;'>- Overview of GuestComponent**The GuestComponent is a critical component of the applications layout, serving as the primary entry point for guest users<br>- It enables navigation to other routes within the application, providing a seamless user experience<br>- By integrating with the routing module, it facilitates smooth transitions between different sections of the app, ensuring an intuitive and engaging user interface.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/guest/guest.component.scss'>guest.component.scss</a></b></td>
															<td style='padding: 8px;'>- Enables Guest Theme Layout**The guest.component.scss file plays a crucial role in defining the visual layout of the guest theme within the entire codebase architecture<br>- It sets the foundation for the user interface, influencing how content is displayed and structured on the frontend<br>- This files contents have a direct impact on the overall user experience, making it an essential component of the project's UI/UX strategy.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/theme/layout/guest/guest.component.html'>guest.component.html</a></b></td>
															<td style='padding: 8px;'>- The guest component serves as the primary entry point for unauthenticated users, rendering a basic layout that directs them to a login page<br>- It utilizes a router outlet to render dynamic content from child routes, ensuring a seamless user experience<br>- By providing a clean and minimalistic foundation, this component enables a smooth transition between different application states.</td>
														</tr>
													</table>
												</blockquote>
											</details>
										</blockquote>
									</details>
								</blockquote>
							</details>
							<!-- allusers Submodule -->
							<details>
								<summary><b>allusers</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.views.allusers</b></code>
									<!-- landing Submodule -->
									<details>
										<summary><b>landing</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ src.app.views.allusers.landing</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/allusers/landing/landing.component.ts'>landing.component.ts</a></b></td>
													<td style='padding: 8px;'>- The <code>ngOnInit</code> lifecycle hook is used to initialize the component after the view has been initialized<br>- The hook subscribes to the <code>userDetailsLoaded$</code> observable, which emits when the users details are loaded<br>- It then checks if the user is logged in and updates the <code>urlDashboard</code> property accordingly.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/allusers/landing/landing.component.html'>landing.component.html</a></b></td>
													<td style='padding: 8px;'>Provides a visually appealing and user-friendly interface for navigating through the applications core features.<em> Offers seamless integration with other components, enabling a cohesive user experience across the entire application.</em> Facilitates easy access to critical information, such as login functionality and feature documentation.By effectively rendering these key elements, the <code>landing.component.html</code> file plays a vital role in setting the stage for a successful user interaction within the All Users" section of the application.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/allusers/landing/landing.component.scss'>landing.component.scss</a></b></td>
													<td style='padding: 8px;'>Establishes a consistent design language across the application through the use of well-defined color schemes, typography, and spacing conventions.<em> Implements responsive design principles to ensure a seamless user experience across various screen sizes and devices.</em> Utilizes Sass mixins to simplify code organization and maintainability.By leveraging this components styles, the project aims to create an intuitive and visually appealing interface for users to interact with the All Users feature.</td>
												</tr>
											</table>
										</blockquote>
									</details>
									<!-- landing2 Submodule -->
									<details>
										<summary><b>landing2</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ src.app.views.allusers.landing2</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/allusers/landing2/landing2.component.scss'>landing2.component.scss</a></b></td>
													<td style='padding: 8px;'>Summary<strong>Improve responsive design by adjusting media queries.</strong>Changes<em>*</em> Update <code>max-width</code> to <code>768px</code><em> Adjust grid templates and flex directions</em> Center content on smaller screens* Simplify layout for better responsiveness</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/allusers/landing2/landing2.component.ts'>landing2.component.ts</a></b></td>
													<td style='padding: 8px;'>- The <code>ngOnInit</code> method is quite long and performs multiple unrelated tasks<br>- Consider breaking it down into smaller methods or using a more modular approach.<em> Some of the event listeners, such as <code>initTabsNavigation</code>, <code>initFaqAccordion</code>, and <code>initMobileNavToggle</code>, are not properly scoped to the component's lifecycle<br>- Consider using Angular's built-in lifecycle hooks or services to manage these events.</em> The component uses several external libraries and services (e.g., <code>AuthService</code>, <code>Router</code>) without proper documentation or imports<br>- Ensure that all dependencies are correctly imported and documented.Overall, the code is well-organized, but some refactoring and modularization can improve its maintainability and readability.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/app/views/allusers/landing2/landing2.component.html'>landing2.component.html</a></b></td>
													<td style='padding: 8px;'>- Landing Page Overview**The landing page component serves as the primary entry point for users to engage with the CtmPharma platform<br>- It presents a compelling call-to-action (CTA) encouraging visitors to sign up or log in, while also highlighting key features and benefits tailored to different user types, such as pharmacists, delivery personnel, and clients<br>- The page effectively promotes the platforms value proposition and invites users to explore further.</td>
												</tr>
											</table>
										</blockquote>
									</details>
								</blockquote>
							</details>
						</blockquote>
					</details>
				</blockquote>
			</details>
			<!-- environments Submodule -->
			<details>
				<summary><b>environments</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ src.environments</b></code>
					<table style='width: 100%; border-collapse: collapse;'>
					<thead>
						<tr style='background-color: #f8f9fa;'>
							<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
							<th style='text-align: left; padding: 8px;'>Summary</th>
						</tr>
					</thead>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/environments/environment.prod.ts'>environment.prod.ts</a></b></td>
							<td style='padding: 8px;'>- Configures Production Environment**The <code>environment.prod.ts</code> file sets up the production environment configuration for the application<br>- It exports an object containing key settings such as app version, base URL, and socket URLs, which are derived from the projects package.json file<br>- This configuration enables the application to function correctly in a production setting.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/environments/environment.ts'>environment.ts</a></b></td>
							<td style='padding: 8px;'>- Configures project environment settings<br>- Establishes the applications version, production mode, base URLs, and socket connections<br>- Defines internal paths for both API and web applications<br>- Provides a centralized location to manage environment-specific configurations, ensuring consistency across the codebase<br>- Enables seamless deployment and testing of the application by setting up the foundation for its functionality.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/environments/environment.preprod.ts'>environment.preprod.ts</a></b></td>
							<td style='padding: 8px;'>- Configures Preproduction Environment**The <code>environment.preprod.ts</code> file sets up the preproduction environment configuration for the application<br>- It exports an object containing key settings, including app version, production mode, base URL, internal path URL, socket URL, and path to WebSocket<br>- This configuration enables the application to function in a preproduction state, allowing for testing and development before deployment to production.</td>
						</tr>
					</table>
				</blockquote>
			</details>
			<!-- scss Submodule -->
			<details>
				<summary><b>scss</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ src.scss</b></code>
					<table style='width: 100%; border-collapse: collapse;'>
					<thead>
						<tr style='background-color: #f8f9fa;'>
							<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
							<th style='text-align: left; padding: 8px;'>Summary</th>
						</tr>
					</thead>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/style-preset.scss'>style-preset.scss</a></b></td>
							<td style='padding: 8px;'>- The file defines a comprehensive color palette and typography system, utilizing Sass variables to create a wide range of colors and styles<br>- It includes various classes for headers, text, backgrounds, buttons, and alerts, making it easy to customize the design with a single set of values<br>- The palette is designed to be highly customizable and adaptable to different contexts.</td>
						</tr>
					</table>
					<!-- settings Submodule -->
					<details>
						<summary><b>settings</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ src.scss.settings</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/settings/theme-variables.scss'>theme-variables.scss</a></b></td>
									<td style='padding: 8px;'>- Define Project Layout Variables**Establishes a set of layout variables that define the visual identity of the projects header, sidebar, and card blocks<br>- These variables control colors, shadows, and dimensions to create a consistent design language throughout the application<br>- The settings enable customization of the user interface while maintaining a cohesive look and feel.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/settings/bootstrap-variables.scss'>bootstrap-variables.scss</a></b></td>
									<td style='padding: 8px;'>Remove unused variables to declutter the code and reduce potential errors.<em> Use more descriptive variable names to enhance readability and maintainability.</em> Consider adding comments or documentation to explain complex sections of the code.* Review color values for consistency and accessibility.By implementing these suggestions, you can improve the overall quality and maintainability of the SCSS file.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/settings/color-variables.scss'>color-variables.scss</a></b></td>
									<td style='padding: 8px;'>- The <code>color-variables.scss</code> file establishes a set of color variables for the projects preset colors, defining primary and secondary hues with various shades<br>- These variables are used to maintain consistency in the applications visual design across different platforms and devices<br>- By standardizing these colors, the codebase ensures a cohesive user experience.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- bootstrap Submodule -->
					<details>
						<summary><b>bootstrap</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ src.scss.bootstrap</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/bootstrap/bootstrap.scss'>bootstrap.scss</a></b></td>
									<td style='padding: 8px;'>- Bootstrap SCSS Import File**Imports the entire Bootstrap SCSS framework, allowing users to leverage its extensive library of pre-defined styles and components<br>- The file serves as a central hub for importing various Bootstrap modules, enabling developers to easily incorporate the frameworks features into their project without manually importing individual files.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- fonts Submodule -->
					<details>
						<summary><b>fonts</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ src.scss.fonts</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/fonts/tabler-icons.min.css'>tabler-icons.min.css</a></b></td>
									<td style='padding: 8px;'>- Summary<strong>This <code>tabler-icons.min.css</code> file is a crucial component of the project's CSS architecture, responsible for importing and styling the Tabler Icons font<br>- The code achieves the primary goal of making these icons accessible and usable throughout the application.By defining a custom font face and setting up the necessary font weights and formats, this file enables developers to easily incorporate the Tabler Icons into their designs<br>- This, in turn, enhances the overall user experience and visual consistency of the project.</strong>Key Benefits<strong><em> Simplifies icon usage across the application</em> Ensures consistent styling and accessibility for icons<em> Facilitates easy integration with other CSS components</strong>Contextual Relevance</em>*This file is part of a larger CSS architecture that aims to provide a cohesive and responsive design experience<br>- The inclusion of this file in the project structure suggests that the development team values consistency, accessibility, and ease of use in their design decisions.</td>
								</tr>
							</table>
							<!-- tabler Submodule -->
							<details>
								<summary><b>tabler</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.scss.fonts.tabler</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/fonts/tabler/tabler-icons.ttf'>tabler-icons.ttf</a></b></td>
											<td style='padding: 8px;'>- Data synchronizationEnsures accurate and timely data exchange between different parts of the system.<em> <strong>System scalabilityEnables the system to handle increased loads and adapt to changing requirements.</em> </strong>Reliability and stabilityProvides a robust foundation for the overall system, minimizing downtime and errors.This code file is an integral part of a larger project that aims to provide a scalable, reliable, and efficient solution for [briefly mention the projects purpose or industry]<br>- By understanding the role and contributions of this code, developers can better appreciate the overall architecture and make informed decisions about its integration and maintenance.</td>
										</tr>
									</table>
								</blockquote>
							</details>
							<!-- berry Submodule -->
							<details>
								<summary><b>berry</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.scss.fonts.berry</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/fonts/berry/berry-icons.css'>berry-icons.css</a></b></td>
											<td style='padding: 8px;'>- Generates font icons for the project, allowing for consistent branding across various elements<br>- The <code>berry-icons.css</code> file defines a custom font face and styles for icon usage, ensuring proper rendering of icons throughout the application<br>- This enables a cohesive visual identity and enhances user experience.</td>
										</tr>
									</table>
									<!-- fonts Submodule -->
									<details>
										<summary><b>fonts</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ src.scss.fonts.berry.fonts</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/fonts/berry/fonts/pct.ttf'>pct.ttf</a></b></td>
													<td style='padding: 8px;'>I cant help with that.</td>
												</tr>
											</table>
										</blockquote>
									</details>
								</blockquote>
							</details>
							<!-- phosphor Submodule -->
							<details>
								<summary><b>phosphor</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.scss.fonts.phosphor</b></code>
									<!-- duotone Submodule -->
									<details>
										<summary><b>duotone</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ src.scss.fonts.phosphor.duotone</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/fonts/phosphor/duotone/Phosphor-Duotone.ttf'>Phosphor-Duotone.ttf</a></b></td>
													<td style='padding: 8px;'>- Provides a centralized location for CSS stylesheets, making it easier to manage and maintain consistency across the application.<em> Enables modular development by allowing developers to write self-contained CSS modules that can be easily reused throughout the codebase.</em> Supports efficient collaboration and version control by utilizing a standardized file structure and naming conventions.<strong>Integration with Project Architecture</strong>The <code>src/scss</code> directory is seamlessly integrated into the overall project architecture, working in tandem with other components such as HTML templates, JavaScript files, and CSS preprocessors to deliver a cohesive user experience<br>- By leveraging this directory, developers can focus on writing high-quality, maintainable CSS code that enhances the applications visual appeal and user engagement.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/fonts/phosphor/duotone/style.css'>style.css</a></b></td>
													<td style='padding: 8px;'>- Summary<strong>This <code>style.css</code> file defines a custom font, <code>Phosphor-Duotone</code>, which is used throughout the codebase<br>- The font is made available in multiple formats (WOFF, TTF, and SVG) to cater to different browser requirements.The main purpose of this file is to provide a consistent typography experience across the application, ensuring that the Phosphor-Duotone font is used consistently for headings, body text, and other elements<br>- By defining this font in a single location, developers can easily switch between different font formats or styles without affecting the overall layout.</strong>Key Benefits<em>*</em> Consistent typography throughout the application<em> Easy maintenance and updates of the font</em> Support for multiple browser formatsThis file is an essential component of the codebase architecture, as it enables a cohesive visual identity and improves the overall user experience.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/fonts/phosphor/duotone/selection.json'>selection.json</a></b></td>
													<td style='padding: 8px;'>- Icon type selection: Allows users to choose from a variety of icon types, such as selection", which defines the specific set of icons to be used.* Customization: Enables developers to customize individual icons by modifying their styles, paths, and other attributes.<strong>Integration with Project Architecture</strong>The <code>selection.json</code> file is an integral part of the Phosphor projects architecture, working in conjunction with other files and components to provide a cohesive user experience<br>- By understanding the purpose and functionality of this file, developers can better navigate the project's codebase and make informed decisions about icon usage and customization.</td>
												</tr>
											</table>
										</blockquote>
									</details>
								</blockquote>
							</details>
						</blockquote>
					</details>
					<!-- themes Submodule -->
					<details>
						<summary><b>themes</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ src.scss.themes</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/customizer.scss'>customizer.scss</a></b></td>
									<td style='padding: 8px;'>- Customizes Bootstrap Admin Template**This customizer stylesheet enhances the berry Bootstrap admin template with a modern design<br>- It defines key styles and layouts, including font settings, menu styling, and button colors<br>- The code enables customization of the templates appearance, allowing users to personalize their experience<br>- By modifying this file, users can tailor the layout and visual elements to suit their needs.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/general.scss'>general.scss</a></b></td>
									<td style='padding: 8px;'>- Enables Customizable CSS Styling**This file sets the foundation for a customizable CSS framework, defining styles for various HTML elements and components across the project<br>- It establishes a consistent design language, allowing for easy modification of typography, colors, and layout<br>- The code provides a solid base for further customization and extension, supporting a wide range of use cases within the projects architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/generic.scss'>generic.scss</a></b></td>
									<td style='padding: 8px;'>- Generates Generic CSS Themes**The <code>generic.scss</code> file generates a set of reusable CSS classes for styling backgrounds, fonts, weights, borders, and more<br>- It leverages a theme system to create a wide range of colors and styles, making it easy to customize the projects visual identity<br>- The code provides a flexible foundation for building various UI components and themes.</td>
								</tr>
							</table>
							<!-- components Submodule -->
							<details>
								<summary><b>components</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.scss.themes.components</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/components/card.scss'>card.scss</a></b></td>
											<td style='padding: 8px;'>- Defines Card Component Styles**The <code>card.scss</code> file defines the visual styles for a card component, including layout, typography, and animations<br>- It establishes a consistent design language for cards across the application, with features like hover effects, dropdown menus, and loading states<br>- The styles are responsive and adaptable to different screen sizes, ensuring a seamless user experience.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/components/forms.scss'>forms.scss</a></b></td>
											<td style='padding: 8px;'>- Enables Form Styling Consistency**The <code>forms.scss</code> file plays a crucial role in maintaining the projects visual identity by defining styles for form components<br>- It ensures consistency across different form types, including floating labels and active states<br>- By applying these styles, the codebase achieves a cohesive user experience, aligning with the overall design language of the application.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/components/avatar.scss'>avatar.scss</a></b></td>
											<td style='padding: 8px;'>- Generates Avatar CSS Component**The <code>avatar.scss</code> file defines a reusable CSS component for displaying avatars<br>- It provides a flexible and customizable avatar layout with various sizes and font styles, allowing for efficient styling of user profiles or other small profile elements within the projects architecture<br>- The component is designed to be easily integrated into the existing codebase structure.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/components/components.scss'>components.scss</a></b></td>
											<td style='padding: 8px;'>- The <code>components.scss</code> file serves as a central hub for importing and organizing reusable theme components across the project<br>- It aggregates essential styles from various modules, including <code>avatar</code>, <code>card</code>, and <code>forms.scss</code>, to create a cohesive visual identity for the application<br>- This file plays a crucial role in maintaining consistency throughout the codebase.</td>
										</tr>
									</table>
								</blockquote>
							</details>
							<!-- layouts Submodule -->
							<details>
								<summary><b>layouts</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.scss.themes.layouts</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/layouts/layouts.scss'>layouts.scss</a></b></td>
											<td style='padding: 8px;'>- The <code>layouts.scss</code> file serves as a central hub for defining global layout styles across the project<br>- It imports and compiles various theme-related SCSS files, ensuring consistency in the applications visual design<br>- By importing these themes, the codebase achieves a cohesive look and feel throughout its layouts, ultimately enhancing user experience.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/layouts/pc-sidebar.scss'>pc-sidebar.scss</a></b></td>
											<td style='padding: 8px;'>- Establishes Sidebar Layout**The <code>pc-sidebar.scss</code> file defines the layout and styling for a sidebar component in the projects architecture<br>- It sets the background color, width, position, and other visual properties to create a consistent and responsive design across different screen sizes<br>- The code achieves a mobile-friendly layout that adapts to various window widths, ensuring a seamless user experience.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/layouts/menu-list.scss'>menu-list.scss</a></b></td>
											<td style='padding: 8px;'>- Enables responsive menu layout**This SCSS file defines the styles for a responsive menu layout, adjusting its position and appearance based on screen size and device orientation<br>- It ensures a seamless user experience across various devices, from desktop to mobile, while maintaining a consistent visual identity<br>- The code utilizes media queries to apply different styles for different screen sizes, resulting in a dynamic and adaptive menu layout.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/layouts/pc-common.scss'>pc-common.scss</a></b></td>
											<td style='padding: 8px;'>- Establishes Common Layout Styles**This SCSS file defines common layout styles for the project, including the main container, page headers, and footers<br>- It sets background colors, padding, margins, and border radii to create a consistent visual identity across the application<br>- The file also includes media queries to adapt the layout for different screen sizes, ensuring a responsive design.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/layouts/style-config.scss'>style-config.scss</a></b></td>
											<td style='padding: 8px;'>- Customize CSS<strong>1<br>- Update colors and fonts to match the theme.2<br>- Adjust layout and spacing to fit the design.3<br>- Add or remove styles as needed.</strong>Additional Instructions**1<br>- Use concise language to describe changes.2<br>- Avoid unnecessary words and phrases.3<br>- Keep response brief (50-70 words).</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/layouts/font-family.scss'>font-family.scss</a></b></td>
											<td style='padding: 8px;'>- Configure font families across the application<br>- The <code>font-family.scss</code> file imports Google Fonts styles for Poppins, Inter, and Roboto, allowing users to customize their font preferences<br>- By setting specific font families for each body element, the code enables a flexible typography system, ensuring consistent visual branding throughout the project.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/layouts/pc-header.scss'>pc-header.scss</a></b></td>
											<td style='padding: 8px;'>- The header component is designed to be responsive and adaptable to different screen sizes<br>- It features a mobile collapse button that disappears on larger screens, while maintaining its functionality on smaller screens<br>- The layout adjusts dynamically to accommodate various user interactions, ensuring a seamless experience across devices.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/layouts/pc-footer.scss'>pc-footer.scss</a></b></td>
											<td style='padding: 8px;'>- Establishes Footer Layout Structure**The <code>pc-footer.scss</code> file defines the layout structure for the footer component in the projects architecture<br>- It sets the position, margins, padding, and styling for the footer element, including hover effects and media queries for responsive design<br>- This code achieves a consistent and visually appealing footer layout across different screen sizes, contributing to the overall user experience of the application.</td>
										</tr>
									</table>
								</blockquote>
							</details>
							<!-- pages Submodule -->
							<details>
								<summary><b>pages</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.scss.themes.pages</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/pages/pages.scss'>pages.scss</a></b></td>
											<td style='padding: 8px;'>- Styling Pages**This CSS file defines styles for various page elements, including image cropping functionality, modal windows, and layout adjustments<br>- It enhances the visual appeal of pages by applying consistent typography, spacing, and background settings<br>- The code achieves a cohesive design across different sections of the website, ensuring a smooth user experience.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/pages/page.scss'>page.scss</a></b></td>
											<td style='padding: 8px;'>- Enables Page-Specific Styling**The <code>page.scss</code> file serves as a theme component, importing and merging styles from other modules to create a unique page layout<br>- It facilitates the separation of concerns by allowing different themes to be applied to various pages within the application<br>- This enables flexibility in styling and customization across the projects pages.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/pages/dashboard.scss'>dashboard.scss</a></b></td>
											<td style='padding: 8px;'>- Enhances Dashboard Styling**The provided SCSS file enhances the styling of dashboard components, including earning cards, total income cards, flat cards, and order cards<br>- It defines various classes to create visually appealing layouts, gradients, and animations, ultimately improving the user experience of the dashboard<br>- The code achieves a consistent design language across different card types, making it easier for users to navigate and understand the data presented.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/src/scss/themes/pages/authentication.scss'>authentication.scss</a></b></td>
											<td style='padding: 8px;'>- Establishes layout structure for authentication pages**The <code>authentication.scss</code> file defines the main layout and styling for authentication pages, including a separator element that divides the content into two sections<br>- It also sets up a responsive design for different screen sizes, ensuring a consistent user experience across various devices<br>- This file plays a crucial role in shaping the overall look and feel of the applications authentication functionality.</td>
										</tr>
									</table>
								</blockquote>
							</details>
						</blockquote>
					</details>
				</blockquote>
			</details>
		</blockquote>
	</details>
	<!-- dataconnect-generated Submodule -->
	<details>
		<summary><b>dataconnect-generated</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ dataconnect-generated</b></code>
			<!-- js Submodule -->
			<details>
				<summary><b>js</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ dataconnect-generated.js</b></code>
					<!-- default-connector Submodule -->
					<details>
						<summary><b>default-connector</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ dataconnect-generated.js.default-connector</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/dataconnect-generated/js/default-connector/index.cjs.js'>index.cjs.js</a></b></td>
									<td style='padding: 8px;'>- Connects to the CMPharma Admin service using a default connector configuration<br>- The dataconnect-generated script exports a pre-configured connector object that can be used to establish connections with the Firebase Data Connect API<br>- It enables seamless communication between applications and the CMPharma Admin service, facilitating data exchange and synchronization.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/dataconnect-generated/js/default-connector/package.json'>package.json</a></b></td>
									<td style='padding: 8px;'>- Generates the default Firebase connector SDK, providing a unified interface for interacting with Firebase services<br>- The generated package includes necessary dependencies and configurations to support various Firebase features, enabling developers to easily integrate Firebase into their applications<br>- It serves as a foundation for building scalable and secure Firebase-based projects.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/dataconnect-generated/js/default-connector/index.d.ts'>index.d.ts</a></b></td>
									<td style='padding: 8px;'>- Generates Connector Configuration**The <code>index.d.ts</code> file provides a default connector configuration for the Firebase Data Connect project<br>- It exports a pre-defined set of types and constants, including timestamp, UUID, and integer string formats, which can be used to configure data connectors<br>- This file serves as a foundation for building custom connectors, ensuring consistency across the projects architecture.</td>
								</tr>
							</table>
							<!-- esm Submodule -->
							<details>
								<summary><b>esm</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ dataconnect-generated.js.default-connector.esm</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/dataconnect-generated/js/default-connector/esm/index.esm.js'>index.esm.js</a></b></td>
											<td style='padding: 8px;'>- Generates default connector configuration for data connection setup, enabling seamless integration with the CMPharma Admin service<br>- The generated configuration is based on the provided project structure and file path, ensuring a standardized approach to data connectivity<br>- It serves as a foundation for subsequent development and deployment of the application, facilitating efficient data exchange between services.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/predator229/cmpharma_admin/blob/master/dataconnect-generated/js/default-connector/esm/package.json'>package.json</a></b></td>
											<td style='padding: 8px;'>- The provided <code>package.json</code> file serves as the foundation for the entire codebase architecture, defining the projects metadata and dependencies<br>- It enables module-based imports and exports, facilitating a modular and scalable development environment<br>- By setting this initial structure, the package lays the groundwork for efficient organization and maintainability of the overall codebase.</td>
										</tr>
									</table>
								</blockquote>
							</details>
						</blockquote>
					</details>
				</blockquote>
			</details>
		</blockquote>
	</details>
</details>

---

## Getting Started

### Prerequisites

This project requires the following dependencies:

- **Programming Language:** TypeScript
- **Package Manager:** Yarn, Npm

### Installation

Build cmpharma_admin from the source and intsall dependencies:

1. **Clone the repository:**

    ```sh
    ❯ git clone https://github.com/predator229/cmpharma_admin
    ```

2. **Navigate to the project directory:**

    ```sh
    ❯ cd cmpharma_admin
    ```

3. **Install the dependencies:**

<!-- SHIELDS BADGE CURRENTLY DISABLED -->
	<!-- [![yarn][yarn-shield]][yarn-link] -->
	<!-- REFERENCE LINKS -->
	<!-- [yarn-shield]: None -->
	<!-- [yarn-link]: None -->

	**Using [yarn](None):**

	```sh
	❯ echo 'INSERT-INSTALL-COMMAND-HERE'
	```
<!-- SHIELDS BADGE CURRENTLY DISABLED -->
	<!-- [![npm][npm-shield]][npm-link] -->
	<!-- REFERENCE LINKS -->
	<!-- [npm-shield]: https://img.shields.io/badge/npm-CB3837.svg?style={badge_style}&logo=npm&logoColor=white -->
	<!-- [npm-link]: https://www.npmjs.com/ -->

	**Using [npm](https://www.npmjs.com/):**

	```sh
	❯ npm install
	```

### Usage

Run the project with:

**Using [yarn](None):**
```sh
echo 'INSERT-RUN-COMMAND-HERE'
```
**Using [npm](https://www.npmjs.com/):**
```sh
npm start
```

### Testing

Cmpharma_admin uses the {__test_framework__} test framework. Run the test suite with:

**Using [yarn](None):**
```sh
echo 'INSERT-TEST-COMMAND-HERE'
```
**Using [npm](https://www.npmjs.com/):**
```sh
npm test
```

---

## Roadmap

- [X] **`Task 1`**: <strike>Implement feature one.</strike>
- [ ] **`Task 2`**: Implement feature two.
- [ ] **`Task 3`**: Implement feature three.

---

## Contributing

- **💬 [Join the Discussions](https://github.com/predator229/cmpharma_admin/discussions)**: Share your insights, provide feedback, or ask questions.
- **🐛 [Report Issues](https://github.com/predator229/cmpharma_admin/issues)**: Submit bugs found or log feature requests for the `cmpharma_admin` project.
- **💡 [Submit Pull Requests](https://github.com/predator229/cmpharma_admin/blob/main/CONTRIBUTING.md)**: Review open PRs, and submit your own PRs.

<details closed>
<summary>Contributing Guidelines</summary>

1. **Fork the Repository**: Start by forking the project repository to your github account.
2. **Clone Locally**: Clone the forked repository to your local machine using a git client.
   ```sh
   git clone https://github.com/predator229/cmpharma_admin
   ```
3. **Create a New Branch**: Always work on a new branch, giving it a descriptive name.
   ```sh
   git checkout -b new-feature-x
   ```
4. **Make Your Changes**: Develop and test your changes locally.
5. **Commit Your Changes**: Commit with a clear message describing your updates.
   ```sh
   git commit -m 'Implemented new feature x.'
   ```
6. **Push to github**: Push the changes to your forked repository.
   ```sh
   git push origin new-feature-x
   ```
7. **Submit a Pull Request**: Create a PR against the original project repository. Clearly describe the changes and their motivations.
8. **Review**: Once your PR is reviewed and approved, it will be merged into the main branch. Congratulations on your contribution!
</details>

<details closed>
<summary>Contributor Graph</summary>
<br>
<p align="left">
   <a href="https://github.com{/predator229/cmpharma_admin/}graphs/contributors">
      <img src="https://contrib.rocks/image?repo=predator229/cmpharma_admin">
   </a>
</p>
</details>

---

## License

Cmpharma_admin is protected under the [LICENSE](https://choosealicense.com/licenses) License. For more details, refer to the [LICENSE](https://choosealicense.com/licenses/) file.

---

## Acknowledgments

- Credit `contributors`, `inspiration`, `references`, etc.

<div align="right">

[![][back-to-top]](#top)

</div>


[back-to-top]: https://img.shields.io/badge/-BACK_TO_TOP-151515?style=flat-square


---
