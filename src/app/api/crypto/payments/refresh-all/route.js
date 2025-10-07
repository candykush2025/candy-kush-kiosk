import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    console.log('Starting bulk payment status refresh...');

    // Initialize Firebase
    const { initializeApp, getApps } = await import('firebase/app');
    const { getFirestore, collection, getDocs, doc, updateDoc, query, where } = await import('firebase/firestore');
    
    let app;
    if (getApps().length === 0) {
      app = initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
      });
    } else {
      app = getApps()[0];
    }
    
    const db = getFirestore(app);
    
    // Get all payments that are not in a final state
    const paymentsRef = collection(db, 'crypto_payments');
    const activeStatusQuery = query(paymentsRef, where('payment_status', 'in', ['waiting', 'confirming', 'sending']));
    const querySnapshot = await getDocs(activeStatusQuery);
    
    console.log(`Found ${querySnapshot.size} payments to check`);
    
    const updateResults = {
      total: querySnapshot.size,
      updated: 0,
      errors: 0,
      skipped: 0
    };
    
    // Check each payment status
    for (const paymentDoc of querySnapshot.docs) {
      const paymentData = paymentDoc.data();
      const paymentId = paymentData.payment_id;
      
      try {
        console.log(`Checking status for payment: ${paymentId}`);
        
        const response = await fetch(`https://api.nowpayments.io/v1/payment/${paymentId}`, {
          headers: {
            'x-api-key': process.env.NOWPAYMENT_API_KEY
          }
        });
        
        if (!response.ok) {
          console.error(`Failed to check status for ${paymentId}:`, response.status);
          updateResults.errors++;
          continue;
        }
        
        const statusData = await response.json();
        console.log(`Status for ${paymentId}:`, statusData.payment_status);
        
        // Only update if status has changed
        if (statusData.payment_status !== paymentData.payment_status) {
          const updateData = {
            payment_status: statusData.payment_status,
            updated_at: new Date()
          };
          
          // Add additional fields if available
          if (statusData.actually_paid !== undefined) updateData.actually_paid = statusData.actually_paid;
          if (statusData.outcome_amount !== undefined) updateData.outcome_amount = statusData.outcome_amount;
          if (statusData.outcome_currency !== undefined) updateData.outcome_currency = statusData.outcome_currency;
          if (statusData.payin_hash !== undefined) updateData.payin_hash = statusData.payin_hash;
          if (statusData.payout_hash !== undefined) updateData.payout_hash = statusData.payout_hash;
          
          await updateDoc(doc(db, 'crypto_payments', paymentDoc.id), updateData);
          console.log(`Updated payment ${paymentId} from ${paymentData.payment_status} to ${statusData.payment_status}`);
          updateResults.updated++;
        } else {
          console.log(`No status change for payment ${paymentId}`);
          updateResults.skipped++;
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error checking payment ${paymentId}:`, error);
        updateResults.errors++;
      }
    }
    
    console.log('Bulk payment refresh completed:', updateResults);
    
    return NextResponse.json({
      success: true,
      message: `Checked ${updateResults.total} payments`,
      results: updateResults
    });
    
  } catch (error) {
    console.error('Error in bulk payment refresh:', error);
    return NextResponse.json(
      { error: 'Failed to refresh payment statuses' },
      { status: 500 }
    );
  }
}