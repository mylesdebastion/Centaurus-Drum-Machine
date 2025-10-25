/**
 * Intelligent UX Solution Discovery for Persona Issues
 *
 * Navigates /playground and key routes to discover existing components
 * that could solve UX issues identified in persona testing.
 *
 * Usage:
 *   node discover-solutions.js --story=22.1 --persona=e --issues="visual-learning,accessibility,pricing"
 *   node discover-solutions.js --assessment=docs/qa/assessments/22.1-ux-educator-20251025.md
 *
 * Options:
 *   --story=epic.story     Story ID (e.g., "22.1")
 *   --persona=code         Persona code (e.g., "e" for Educator)
 *   --issues=list          Comma-separated issue keywords to search for
 *   --assessment=path      Path to assessment report (auto-extracts issues)
 *   --base=url             Base URL (default: http://localhost:5173)
 *   --routes=list          Additional routes to explore (default: /playground)
 *
 * Discovery Strategy:
 *   1. Parse assessment report to extract issue keywords
 *   2. Navigate to /playground (feature showcase)
 *   3. Discover available components/features via DOM inspection
 *   4. Capture screenshots of relevant features
 *   5. Match features to issues using AI analysis
 *   6. Output discovery report with integration recommendations
 *
 * Output: testing/persona-ux/discovery/{story}-{persona}/
 *   - discovery-report.json (structured data)
 *   - screenshots/{feature-name}.png (evidence)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value || true;
  return acc;
}, {});

const STORY_ID = args.story || 'adhoc';
const PERSONA_CODE = args.persona;
const BASE_URL = args.base || 'http://localhost:5173';
const ASSESSMENT_PATH = args.assessment;
const CUSTOM_ROUTES = args.routes ? args.routes.split(',') : [];

// Default discovery routes (high-value feature showcases)
const DISCOVERY_ROUTES = [
  '/playground',
  '/',
  ...CUSTOM_ROUTES
];

// Issue keywords (can be auto-extracted from assessment)
let ISSUE_KEYWORDS = args.issues ? args.issues.split(',') : [];

// Validate required args
if (!PERSONA_CODE) {
  console.error('❌ Error: --persona is required');
  console.error('Usage: node discover-solutions.js --persona=e --story=22.1');
  process.exit(1);
}

const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
const discoveryDir = path.join(__dirname, 'discovery', `${STORY_ID}-${PERSONA_CODE}`);
const screenshotDir = path.join(discoveryDir, 'screenshots');

// Ensure directories exist
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

console.log(`\n🔍 UX Solution Discovery`);
console.log(`========================`);
console.log(`Story: ${STORY_ID}`);
console.log(`Persona: ${PERSONA_CODE}`);
console.log(`Base URL: ${BASE_URL}`);
console.log(`Output: ${discoveryDir}/`);
console.log(`Timestamp: ${timestamp}\n`);

/**
 * Extract issue keywords from assessment report
 */
async function extractIssuesFromAssessment(assessmentPath) {
  if (!assessmentPath || !fs.existsSync(assessmentPath)) {
    console.warn(`⚠️  Assessment file not found: ${assessmentPath}`);
    return [];
  }

  const content = fs.readFileSync(assessmentPath, 'utf-8');

  // Extract critical/major issues sections
  const criticalMatch = content.match(/### Critical Issues[\s\S]*?(?=###|$)/);
  const majorMatch = content.match(/### Major Issues[\s\S]*?(?=###|$)/);

  const issues = [];

  // Parse issue descriptions for keywords
  const issueText = (criticalMatch ? criticalMatch[0] : '') + (majorMatch ? majorMatch[0] : '');

  // Common UX issue patterns to extract
  const patterns = [
    /No\s+([\w\s]+?)\s+(?:demo|demonstration|shown)/gi,
    /Missing\s+([\w\s]+?)\s+(?:features|support)/gi,
    /(visual\s+learning|accessibility|pricing|interactive|collaboration|chromebook)/gi,
    /Persona Voice.*?"([^"]+)"/gi
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(issueText)) !== null) {
      const keyword = match[1]?.trim().toLowerCase();
      if (keyword && keyword.length > 3 && !issues.includes(keyword)) {
        issues.push(keyword);
      }
    }
  });

  console.log(`📋 Extracted ${issues.length} issue keywords from assessment:`);
  issues.forEach(issue => console.log(`   - ${issue}`));
  console.log('');

  return issues;
}

/**
 * Discover available features on a route
 */
async function discoverFeatures(page, route) {
  console.log(`\n🔍 Exploring: ${route}`);
  console.log(`${'='.repeat(50)}`);

  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {
    console.warn(`⚠️  Failed to load ${route}, continuing...`);
  });

  await page.waitForTimeout(2000); // Wait for dynamic content

  // Discover interactive elements
  const features = await page.evaluate(() => {
    const discovered = [];

    // Look for feature cards, modules, buttons with descriptive text
    const selectors = [
      'button', 'a', '[role="button"]',
      '.module', '.component', '.feature',
      '[data-feature]', '[data-module]',
      'h1', 'h2', 'h3' // Headings often describe features
    ];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        const text = el.textContent?.trim();
        const ariaLabel = el.getAttribute('aria-label');
        const dataFeature = el.getAttribute('data-feature');
        const href = el.getAttribute('href');

        if (text || ariaLabel || dataFeature) {
          discovered.push({
            type: el.tagName.toLowerCase(),
            text: text?.substring(0, 100) || null,
            ariaLabel: ariaLabel,
            dataFeature: dataFeature,
            href: href,
            classes: el.className
          });
        }
      });
    });

    // Deduplicate by text
    const unique = [];
    const seen = new Set();
    discovered.forEach(item => {
      const key = item.text || item.ariaLabel || item.dataFeature;
      if (key && !seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    });

    return unique.slice(0, 50); // Limit to top 50 discoveries
  });

  console.log(`✅ Discovered ${features.length} features/components`);
  features.slice(0, 10).forEach(f => {
    console.log(`   - ${f.type}: "${f.text || f.ariaLabel}" ${f.href ? `(${f.href})` : ''}`);
  });

  return features;
}

/**
 * Capture screenshot of specific feature/area
 */
async function captureFeature(page, featureName, description) {
  const filename = `${featureName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.png`;
  const filepath = path.join(screenshotDir, filename);

  try {
    await page.screenshot({
      path: filepath,
      fullPage: false
    });
    console.log(`📸 Captured: ${filename}`);
    return {
      filename,
      filepath,
      description
    };
  } catch (error) {
    console.error(`❌ Failed to capture ${filename}:`, error.message);
    return null;
  }
}

/**
 * Match discovered features to persona issues
 */
function matchFeaturesToIssues(features, issues) {
  const matches = [];

  issues.forEach(issue => {
    const issueKeywords = issue.toLowerCase().split(/\s+/);

    features.forEach(feature => {
      const featureText = (
        (feature.text || '') + ' ' +
        (feature.ariaLabel || '') + ' ' +
        (feature.dataFeature || '') + ' ' +
        (feature.href || '')
      ).toLowerCase();

      // Check if feature text contains any issue keywords
      const relevance = issueKeywords.filter(keyword =>
        featureText.includes(keyword)
      ).length;

      if (relevance > 0) {
        matches.push({
          issue: issue,
          feature: feature,
          relevance: relevance,
          confidence: relevance / issueKeywords.length
        });
      }
    });
  });

  // Sort by relevance
  matches.sort((a, b) => b.relevance - a.relevance);

  return matches;
}

/**
 * Main discovery workflow
 */
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Step 1: Extract issues from assessment (if provided)
    if (ASSESSMENT_PATH) {
      const extractedIssues = await extractIssuesFromAssessment(ASSESSMENT_PATH);
      ISSUE_KEYWORDS = [...ISSUE_KEYWORDS, ...extractedIssues];
    }

    if (ISSUE_KEYWORDS.length === 0) {
      console.warn('⚠️  No issues specified. Discovery will capture all features found.');
    }

    // Step 2: Discover features across routes
    const allFeatures = [];
    const routeData = [];

    for (const route of DISCOVERY_ROUTES) {
      const features = await discoverFeatures(page, route);

      // Capture screenshot of route
      const screenshot = await captureFeature(
        page,
        `route-${route.replace(/\//g, '-') || 'root'}`,
        `Overview of ${route}`
      );

      routeData.push({
        route,
        features,
        screenshot
      });

      allFeatures.push(...features);
    }

    // Step 3: Match features to issues
    console.log(`\n🔗 Matching features to persona issues...`);
    const matches = matchFeaturesToIssues(allFeatures, ISSUE_KEYWORDS);

    console.log(`\n✅ Found ${matches.length} potential solutions`);
    matches.slice(0, 10).forEach(match => {
      console.log(`   - Issue: "${match.issue}" → Feature: "${match.feature.text}" (${Math.round(match.confidence * 100)}% confidence)`);
    });

    // Step 4: Generate discovery report
    const report = {
      meta: {
        story: STORY_ID,
        persona: PERSONA_CODE,
        timestamp: new Date().toISOString(),
        date: timestamp,
        baseUrl: BASE_URL,
        routesExplored: DISCOVERY_ROUTES,
        issuesSearched: ISSUE_KEYWORDS
      },
      summary: {
        totalFeaturesDiscovered: allFeatures.length,
        routesExplored: DISCOVERY_ROUTES.length,
        potentialSolutions: matches.length,
        highConfidenceMatches: matches.filter(m => m.confidence >= 0.5).length
      },
      discoveries: routeData,
      solutions: {
        existing: matches.filter(m => m.confidence >= 0.5).map(m => ({
          issue: m.issue,
          existingFeature: m.feature.text || m.feature.ariaLabel,
          location: m.feature.href || 'Unknown',
          confidence: Math.round(m.confidence * 100) + '%',
          recommendation: `Consider integrating existing "${m.feature.text}" component into ${PERSONA_CODE} tutorial`
        })),
        newFeaturesNeeded: ISSUE_KEYWORDS.filter(issue =>
          !matches.find(m => m.issue === issue && m.confidence >= 0.5)
        ).map(issue => ({
          issue: issue,
          status: 'No existing solution found',
          recommendation: 'New feature development required'
        }))
      }
    };

    // Save report
    const reportPath = path.join(discoveryDir, 'discovery-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n✅ Discovery Complete!`);
    console.log(`📁 Report saved to: ${reportPath}`);
    console.log(`📸 Screenshots saved to: ${screenshotDir}/`);
    console.log(`\n🔍 Next step: Review discovery report and identify integration opportunities`);
    console.log(`   @qa *ux-discover ${STORY_ID} --persona=${PERSONA_CODE}\n`);

  } catch (error) {
    console.error(`\n❌ Discovery failed:`, error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
