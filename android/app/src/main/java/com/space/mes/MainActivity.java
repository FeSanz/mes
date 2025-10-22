package com.space.mes;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import androidx.core.view.WindowCompat; // 👈 importante este import

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // 🔧 Restaura el comportamiento clásico (sin modo inmersivo)
    WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
  }
}
