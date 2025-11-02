"use client";

import { useState } from "react";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  jointBuilderSteps,
  paperOptions,
  filterOptions,
  wormOptions,
  flowerOptions,
  hashOptions,
  externalCoatingOptions,
  externalWrapOptions,
  compatibilityRules,
} from "@/app/menu/personalizedJoint/utils/jointBuilderData";

export default function JointBuilderDataUpload() {
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  const uploadData = async () => {
    setUploading(true);
    setStatus("🚀 Starting Joint Builder data migration to Firebase...\n\n");

    try {
      // 1. Upload Steps
      setStatus((prev) => prev + "📋 Uploading steps...\n");
      const stepsRef = collection(db, "jointBuilderSteps");
      for (const step of jointBuilderSteps) {
        await setDoc(doc(stepsRef, step.id), step);
        setStatus((prev) => prev + `✅ Uploaded step: ${step.name}\n`);
      }

      // 2. Upload Paper Options
      setStatus((prev) => prev + "\n📄 Uploading paper options...\n");
      const papersRef = collection(db, "jointBuilderPapers");
      for (const paper of paperOptions) {
        await setDoc(doc(papersRef, paper.id), paper);
        setStatus((prev) => prev + `✅ Uploaded paper: ${paper.name}\n`);
      }

      // 3. Upload Filter Options
      setStatus((prev) => prev + "\n🔍 Uploading filter options...\n");
      const filtersRef = collection(db, "jointBuilderFilters");
      for (const filter of filterOptions) {
        await setDoc(doc(filtersRef, filter.id), filter);
        setStatus((prev) => prev + `✅ Uploaded filter: ${filter.name}\n`);
      }

      // 4. Upload Filling Options
      setStatus((prev) => prev + "\n🪱 Uploading filling options...\n");
      const fillingsRef = collection(db, "jointBuilderFillings");

      for (const worm of wormOptions) {
        await setDoc(doc(fillingsRef, worm.id), worm);
        setStatus((prev) => prev + `✅ Uploaded worm: ${worm.name}\n`);
      }

      for (const flower of flowerOptions) {
        await setDoc(doc(fillingsRef, flower.id), flower);
        setStatus((prev) => prev + `✅ Uploaded flower: ${flower.name}\n`);
      }

      for (const hash of hashOptions) {
        await setDoc(doc(fillingsRef, hash.id), hash);
        setStatus((prev) => prev + `✅ Uploaded hash: ${hash.name}\n`);
      }

      // 5. Upload External Options
      setStatus((prev) => prev + "\n✨ Uploading external options...\n");
      const externalsRef = collection(db, "jointBuilderExternals");

      for (const coating of externalCoatingOptions) {
        await setDoc(doc(externalsRef, coating.id), coating);
        setStatus((prev) => prev + `✅ Uploaded coating: ${coating.name}\n`);
      }

      for (const wrap of externalWrapOptions) {
        await setDoc(doc(externalsRef, wrap.id), wrap);
        setStatus((prev) => prev + `✅ Uploaded wrap: ${wrap.name}\n`);
      }

      // 6. Upload Compatibility Rules
      setStatus((prev) => prev + "\n🔗 Uploading compatibility rules...\n");
      const rulesRef = collection(db, "jointBuilderRules");
      for (const rule of compatibilityRules) {
        await setDoc(doc(rulesRef, rule.id), rule);
        setStatus((prev) => prev + `✅ Uploaded rule: ${rule.id}\n`);
      }

      setStatus((prev) => prev + "\n✨ ================================\n");
      setStatus((prev) => prev + "✅ ALL DATA SUCCESSFULLY UPLOADED!\n");
      setStatus((prev) => prev + "================================\n\n");
      setStatus((prev) => prev + "Summary:\n");
      setStatus((prev) => prev + `- Steps: ${jointBuilderSteps.length}\n`);
      setStatus((prev) => prev + `- Paper Options: ${paperOptions.length}\n`);
      setStatus((prev) => prev + `- Filter Options: ${filterOptions.length}\n`);
      setStatus(
        (prev) =>
          prev +
          `- Fillings: ${
            wormOptions.length + flowerOptions.length + hashOptions.length
          }\n`
      );
      setStatus(
        (prev) =>
          prev +
          `- Externals: ${
            externalCoatingOptions.length + externalWrapOptions.length
          }\n`
      );
      setStatus((prev) => prev + `- Rules: ${compatibilityRules.length}\n`);
    } catch (error) {
      setStatus((prev) => prev + `\n❌ Error: ${error.message}\n`);
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Joint Builder Data Upload</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <p className="mb-4">
            This will upload all joint builder data to Firebase:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-1">
            <li>{jointBuilderSteps.length} workflow steps</li>
            <li>{paperOptions.length} paper types</li>
            <li>{filterOptions.length} filter types</li>
            <li>
              {wormOptions.length + flowerOptions.length + hashOptions.length}{" "}
              filling options
            </li>
            <li>
              {externalCoatingOptions.length + externalWrapOptions.length}{" "}
              external options
            </li>
            <li>{compatibilityRules.length} compatibility rules</li>
          </ul>

          <button
            onClick={uploadData}
            disabled={uploading}
            className={`px-6 py-3 rounded-lg font-semibold ${
              uploading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {uploading ? "Uploading..." : "Upload Data to Firebase"}
          </button>
        </div>

        {status && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Status</h2>
            <pre className="whitespace-pre-wrap font-mono text-sm text-green-400 overflow-auto max-h-96">
              {status}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
