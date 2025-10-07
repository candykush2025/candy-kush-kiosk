import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { payment_id } = params;

    if (!payment_id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    console.log('Checking payment status for:', payment_id);

    const response = await fetch(`https://api.nowpayments.io/v1/payment/${payment_id}`, {
      headers: {
        'x-api-key': process.env.NOWPAYMENT_API_KEY
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('NOWPayments status check error:', response.status, errorData);
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Payment status response:', data);
    
    // Update Firebase with the latest payment status
    try {
      const { initializeApp, getApps } = await import('firebase/app');
      const { getFirestore, collection, query, where, getDocs, doc, updateDoc } = await import('firebase/firestore');
      
      // Initialize Firebase Admin
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
      
      // Find the payment document by payment_id
      const paymentsRef = collection(db, 'crypto_payments');
      const paymentQuery = query(paymentsRef, where('payment_id', '==', payment_id));
      const querySnapshot = await getDocs(paymentQuery);
      
      if (!querySnapshot.empty) {
        const paymentDoc = querySnapshot.docs[0];
        const updateData = {
          payment_status: data.payment_status,
          updated_at: new Date()
        };
        
        // Add additional fields if available
        if (data.actually_paid !== undefined) updateData.actually_paid = data.actually_paid;
        if (data.outcome_amount !== undefined) updateData.outcome_amount = data.outcome_amount;
        if (data.outcome_currency !== undefined) updateData.outcome_currency = data.outcome_currency;
        if (data.payin_hash !== undefined) updateData.payin_hash = data.payin_hash;
        if (data.payout_hash !== undefined) updateData.payout_hash = data.payout_hash;
        
        await updateDoc(doc(db, 'crypto_payments', paymentDoc.id), updateData);
        console.log('Successfully updated Firebase payment status for:', payment_id);
      } else {
        console.warn('Payment document not found in Firebase for payment_id:', payment_id);
      }
      
    } catch (firebaseError) {
      console.error('Error updating Firebase payment status:', firebaseError);
      // Don't fail the API request if Firebase update fails
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}